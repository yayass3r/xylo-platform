/**
 * خدمة العملات والشحن لمنصة زايلو
 * Coins and Top-up Service for Xylo Platform
 *
 * القواعد المالية:
 * - 1 دولار = 1000 عملة (Coin)
 * - حزمة 1$ = 1000 عملة
 * - حزمة 5$ = 5000 عملة
 * - حزمة 10$ = 10000 عملة
 */

import { prisma } from '@/lib/db';
import { randomUUID } from 'crypto';

// ==================== Constants ====================

/**
 * سعر الصرف: 1 دولار = 1000 عملة
 */
export const COINS_PER_DOLLAR = 1000;

/**
 * الحزم الافتراضية
 */
export const DEFAULT_PACKAGES = [
  { id: 'pkg-1', name: 'Starter', nameAr: 'البداية', price: 1, coins: 1000, bonus: 0 },
  { id: 'pkg-2', name: 'Basic', nameAr: 'الأساسية', price: 5, coins: 5000, bonus: 0 },
  { id: 'pkg-3', name: 'Premium', nameAr: 'المميزة', price: 10, coins: 10000, bonus: 500 },
  { id: 'pkg-4', name: 'Pro', nameAr: 'الاحترافية', price: 25, coins: 25000, bonus: 2500 },
  { id: 'pkg-5', name: 'Ultimate', nameAr: 'الأخيرة', price: 50, coins: 50000, bonus: 7500 },
];

// ==================== Types ====================

export interface TopupResult {
  success: boolean;
  message: string;
  transaction?: {
    id: string;
    coinsAdded: number;
    bonusAdded: number;
    newBalance: number;
    paymentReference: string;
  };
}

export interface PackageInfo {
  id: string;
  name: string;
  nameAr: string;
  price: number;
  coins: number;
  bonus: number;
  totalCoins: number;
  isActive: boolean;
}

// ==================== Service Class ====================

class CoinsService {
  /**
   * شراء عملات (شحن المحفظة)
   * Purchase coins (top-up wallet)
   */
  async purchaseCoins(
    userId: string,
    packageId: string,
    paymentData: {
      paymentMethod: string;
      paymentReference: string;
      gatewayId?: string;
      gatewayTransactionId?: string;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<TopupResult> {
    // الحصول على معلومات الحزمة
    const coinPackage = await prisma.coinPackage.findUnique({
      where: { id: packageId },
    });

    if (!coinPackage || !coinPackage.isActive) {
      return {
        success: false,
        message: 'الحزمة غير متوفرة',
      };
    }

    // حساب العملات
    const coinsToAdd = coinPackage.coins + coinPackage.bonus;
    const price = coinPackage.price;

    // استخدام Transaction لضمان الاتساق (ACID)
    try {
      const result = await prisma.$transaction(async (tx) => {
        // 1. الحصول على المحفظة أو إنشاؤها
        let wallet = await tx.wallet.findUnique({
          where: { userId },
        });

        if (!wallet) {
          wallet = await tx.wallet.create({
            data: { userId },
          });
        }

        // 2. تحديث رصيد المحفظة
        const updatedWallet = await tx.wallet.update({
          where: { userId },
          data: {
            coinsBalance: { increment: coinsToAdd },
            totalPurchased: { increment: coinsToAdd },
          },
        });

        // 3. إنشاء سجل المعاملة
        const transaction = await tx.transaction.create({
          data: {
            walletId: wallet.id,
            type: 'PURCHASE',
            amount: coinsToAdd,
            currency: 'COINS',
            status: 'COMPLETED',
            paymentMethod: paymentData.paymentMethod,
            paymentReference: paymentData.paymentReference,
            gatewayId: paymentData.gatewayId,
            gatewayTransactionId: paymentData.gatewayTransactionId,
            description: `شراء حزمة ${coinPackage.nameAr || coinPackage.name} - ${coinsToAdd} عملة`,
            metadata: {
              packageId,
              packageName: coinPackage.name,
              price,
              bonus: coinPackage.bonus,
            },
          },
        });

        // 4. إنشاء سجل الدفع
        await tx.paymentLog.create({
          data: {
            gatewayId: paymentData.gatewayId || 'internal',
            userId,
            transactionType: 'purchase',
            amount: price,
            currency: 'USD',
            status: 'completed',
            gatewayTransactionId: paymentData.gatewayTransactionId,
            coinPackageId: packageId,
            coinsAwarded: coinsToAdd,
            ipAddress: paymentData.ipAddress,
            userAgent: paymentData.userAgent,
            processedAt: new Date(),
          },
        });

        // 5. إنشاء إشعار للمستخدم
        await tx.notification.create({
          data: {
            userId,
            type: 'PURCHASE_SUCCESS',
            title: 'تم شحن رصيدك بنجاح! 💰',
            content: `تم إضافة ${coinsToAdd.toLocaleString()} عملة إلى محفظتك`,
            data: {
              coins: coinsToAdd,
              transactionId: transaction.id,
            },
          },
        });

        return {
          transactionId: transaction.id,
          coinsAdded: coinsToAdd,
          bonusAdded: coinPackage.bonus,
          newBalance: updatedWallet.coinsBalance,
        };
      });

      return {
        success: true,
        message: `تم شحن ${coinsToAdd.toLocaleString()} عملة بنجاح`,
        transaction: {
          id: result.transactionId,
          coinsAdded: result.coinsAdded,
          bonusAdded: result.bonusAdded,
          newBalance: result.newBalance,
          paymentReference: paymentData.paymentReference,
        },
      };
    } catch (error) {
      console.error('Purchase coins error:', error);
      return {
        success: false,
        message: 'حدث خطأ أثناء عملية الشحن. يرجى المحاولة مرة أخرى.',
      };
    }
  }

  /**
   * الحصول على الحزم المتاحة
   * Get available packages
   */
  async getAvailablePackages(): Promise<PackageInfo[]> {
    const packages = await prisma.coinPackage.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });

    if (packages.length === 0) {
      // إنشاء الحزم الافتراضية إذا لم تكن موجودة
      await this.seedDefaultPackages();
      return DEFAULT_PACKAGES.map((pkg) => ({
        ...pkg,
        totalCoins: pkg.coins + pkg.bonus,
        isActive: true,
      }));
    }

    return packages.map((pkg) => ({
      id: pkg.id,
      name: pkg.name,
      nameAr: pkg.nameAr || pkg.name,
      price: pkg.price,
      coins: pkg.coins,
      bonus: pkg.bonus,
      totalCoins: pkg.coins + pkg.bonus,
      isActive: pkg.isActive,
    }));
  }

  /**
   * إنشاء الحزم الافتراضية
   * Seed default packages
   */
  async seedDefaultPackages(): Promise<void> {
    for (const pkg of DEFAULT_PACKAGES) {
      await prisma.coinPackage.upsert({
        where: { id: pkg.id },
        update: {
          name: pkg.name,
          nameAr: pkg.nameAr,
          price: pkg.price,
          coins: pkg.coins,
          bonus: pkg.bonus,
          isActive: true,
        },
        create: {
          id: pkg.id,
          name: pkg.name,
          nameAr: pkg.nameAr,
          price: pkg.price,
          coins: pkg.coins,
          bonus: pkg.bonus,
          isActive: true,
        },
      });
    }
  }

  /**
   * الحصول على رصيد المحفظة
   * Get wallet balance
   */
  async getBalance(userId: string): Promise<{
    coins: number;
    diamonds: number;
    totalPurchased: number;
    totalSpent: number;
    totalEarned: number;
  }> {
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      return {
        coins: 0,
        diamonds: 0,
        totalPurchased: 0,
        totalSpent: 0,
        totalEarned: 0,
      };
    }

    return {
      coins: wallet.coinsBalance,
      diamonds: wallet.diamondsBalance,
      totalPurchased: wallet.totalPurchased,
      totalSpent: wallet.totalSpent,
      totalEarned: wallet.totalEarned,
    };
  }

  /**
   * الحصول على سجل المعاملات
   * Get transaction history
   */
  async getTransactionHistory(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    transactions: Array<{
      id: string;
      type: string;
      amount: number;
      currency: string;
      status: string;
      description: string | null;
      createdAt: Date;
    }>;
    total: number;
    hasMore: boolean;
  }> {
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      return { transactions: [], total: 0, hasMore: false };
    }

    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.transaction.count({
        where: { walletId: wallet.id },
      }),
    ]);

    return {
      transactions: transactions.map((t) => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        currency: t.currency,
        status: t.status,
        description: t.description,
        createdAt: t.createdAt,
      })),
      total,
      hasMore: total > skip + limit,
    };
  }

  /**
   * حساب العملات من مبلغ الدولار
   * Calculate coins from USD amount
   */
  calculateCoinsFromUsd(usdAmount: number): number {
    return Math.floor(usdAmount * COINS_PER_DOLLAR);
  }

  /**
   * حساب قيمة الدولار من العملات
   * Calculate USD value from coins
   */
  calculateUsdFromCoins(coins: number): number {
    return coins / COINS_PER_DOLLAR;
  }

  /**
   * التحقق من كفاية الرصيد
   * Check if user has enough coins
   */
  async hasEnoughCoins(userId: string, amount: number): Promise<boolean> {
    const balance = await this.getBalance(userId);
    return balance.coins >= amount;
  }
}

// ==================== Singleton Instance ====================

export const coinsService = new CoinsService();

// ==================== Exports ====================

export default coinsService;
