/**
 * نظام سحب الأرباح والعمولات لمنصة زايلو
 * Withdrawal and Commission System for Xylo Platform
 *
 * القواعد المالية:
 * - 1000 ألماسة = 1 دولار
 * - الكاتب يحصل على 90% من القيمة
 * - المنصة تأخذ 10% عمولة
 * - الحد الأدنى للسحب من لوحة التحكم
 */

import { prisma } from '@/lib/db';

// ==================== Constants ====================

/**
 * سعر التحويل: 1000 ألماسة = 1 دولار
 */
export const DIAMONDS_PER_USD = 1000;

/**
 * نسبة عمولة المنصة: 10%
 */
export const PLATFORM_COMMISSION_RATE = 0.10;

/**
 * نسبة الكاتب: 90%
 */
export const WRITER_SHARE_RATE = 0.90;

/**
 * الحد الأدنى الافتراضي للسحب (ألماسة)
 */
export const DEFAULT_MIN_WITHDRAWAL_DIAMONDS = 1000;

// ==================== Types ====================

export interface WithdrawalRequest {
  id: string;
  userId: string;
  diamondAmount: number;
  usdValue: number;
  platformFee: number;
  netAmount: number;
  status: string;
  createdAt: Date;
}

export interface WithdrawalResult {
  success: boolean;
  message: string;
  withdrawal?: {
    id: string;
    diamondAmount: number;
    usdValue: number;
    platformFee: number;
    netAmount: number;
    status: string;
  };
}

export interface PlatformRevenueStats {
  totalWithdrawalCommission: number;
  totalGiftCommission: number;
  totalRevenue: number;
  pendingWithdrawals: number;
  completedWithdrawals: number;
}

// ==================== Service Class ====================

class WithdrawalService {
  /**
   * طلب سحب أرباح
   * Request withdrawal
   * 
   * المعادلة:
   * - القيمة بالدولار = الألماس / 1000
   * - عمولة المنصة = القيمة * 10%
   * - صافي الكاتب = القيمة * 90%
   */
  async requestWithdrawal(
    userId: string,
    diamondAmount: number,
    bankDetails: {
      bankName: string;
      bankAccount: string;
      accountHolderName: string;
    }
  ): Promise<WithdrawalResult> {
    // الحصول على إعدادات الحد الأدنى للسحب
    const minWithdrawalSetting = await prisma.systemSetting.findUnique({
      where: { key: 'min_withdrawal_diamonds' },
    });
    const minWithdrawal = minWithdrawalSetting
      ? parseInt(minWithdrawalSetting.value)
      : DEFAULT_MIN_WITHDRAWAL_DIAMONDS;

    // التحقق من الحد الأدنى
    if (diamondAmount < minWithdrawal) {
      return {
        success: false,
        message: `الحد الأدنى للسحب هو ${minWithdrawal.toLocaleString()} ألماسة`,
      };
    }

    // التحقق من KYC
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { kycVerification: true },
    });

    if (!user) {
      return {
        success: false,
        message: 'المستخدم غير موجود',
      };
    }

    if (!user.isKycVerified || !user.kycVerification || user.kycVerification.status !== 'APPROVED') {
      return {
        success: false,
        message: 'يجب التحقق من هويتك أولاً (KYC) لسحب الأرباح',
      };
    }

    // ========== ACID TRANSACTION ==========
    try {
      const result = await prisma.$transaction(async (tx) => {
        // 1. الحصول على المحفظة
        const wallet = await tx.wallet.findUnique({
          where: { userId },
        });

        if (!wallet) {
          throw new Error('WALLET_NOT_FOUND');
        }

        // 2. التحقق من الرصيد
        if (wallet.diamondsBalance < diamondAmount) {
          throw new Error('INSUFFICIENT_BALANCE');
        }

        // 3. حساب القيم المالية
        const usdValue = diamondAmount / DIAMONDS_PER_USD;
        const platformFee = usdValue * PLATFORM_COMMISSION_RATE;
        const netAmount = usdValue * WRITER_SHARE_RATE;

        // 4. خصم الألماس من المحفظة (Atomic)
        await tx.wallet.update({
          where: { userId },
          data: {
            diamondsBalance: { decrement: diamondAmount },
            totalWithdrawn: { increment: diamondAmount },
          },
        });

        // 5. إنشاء طلب السحب
        const withdrawal = await tx.withdrawalRequest.create({
          data: {
            userId,
            diamondAmount,
            usdValue,
            platformFee,
            netAmount,
            currency: 'USD',
            bankName: bankDetails.bankName,
            bankAccount: bankDetails.bankAccount,
            accountHolderName: bankDetails.accountHolderName,
            status: 'PENDING',
          },
        });

        // 6. إنشاء معاملة
        await tx.transaction.create({
          data: {
            walletId: wallet.id,
            type: 'WITHDRAWAL',
            amount: diamondAmount,
            currency: 'DIAMONDS',
            status: 'PENDING',
            description: `طلب سحب ${diamondAmount.toLocaleString()} ألماسة (${netAmount.toFixed(2)}$)`,
            metadata: {
              withdrawalId: withdrawal.id,
              usdValue,
              platformFee,
              netAmount,
            },
          },
        });

        // 7. تسجيل إيراد المنصة (في انتظار الموافقة)
        await tx.platformRevenue.create({
          data: {
            source: 'withdrawal_commission',
            sourceId: withdrawal.id,
            grossAmount: usdValue,
            commissionRate: PLATFORM_COMMISSION_RATE,
            netRevenue: platformFee,
            currency: 'USD',
          },
        });

        // 8. إنشاء إشعار
        await tx.notification.create({
          data: {
            userId,
            type: 'WITHDRAWAL_REQUEST',
            title: 'تم تقديم طلب السحب',
            content: `تم تقديم طلب سحب ${diamondAmount.toLocaleString()} ألماسة (${netAmount.toFixed(2)}$). سيتم مراجعته خلال 24-48 ساعة.`,
            data: {
              withdrawalId: withdrawal.id,
            },
          },
        });

        return withdrawal;
      });

      return {
        success: true,
        message: `تم تقديم طلب السحب بنجاح. صافي المبلغ: $${result.netAmount.toFixed(2)}`,
        withdrawal: {
          id: result.id,
          diamondAmount: result.diamondAmount,
          usdValue: result.usdValue,
          platformFee: result.platformFee,
          netAmount: result.netAmount,
          status: result.status,
        },
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'WALLET_NOT_FOUND') {
          return { success: false, message: 'المحفظة غير موجودة' };
        }
        if (error.message === 'INSUFFICIENT_BALANCE') {
          return { success: false, message: 'رصيد الألماس غير كافٍ' };
        }
      }

      console.error('Withdrawal request error:', error);
      return {
        success: false,
        message: 'حدث خطأ أثناء تقديم طلب السحب',
      };
    }
  }

  /**
   * معالجة طلب سحب (للمسؤول)
   * Process withdrawal request (admin)
   */
  async processWithdrawal(
    withdrawalId: string,
    adminId: string,
    action: 'APPROVE' | 'REJECT',
    adminNotes?: string
  ): Promise<WithdrawalResult> {
    const withdrawal = await prisma.withdrawalRequest.findUnique({
      where: { id: withdrawalId },
    });

    if (!withdrawal) {
      return { success: false, message: 'طلب السحب غير موجود' };
    }

    if (withdrawal.status !== 'PENDING') {
      return { success: false, message: 'تم معالجة هذا الطلب مسبقاً' };
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        if (action === 'APPROVE') {
          // الموافقة على السحب
          const updated = await tx.withdrawalRequest.update({
            where: { id: withdrawalId },
            data: {
              status: 'APPROVED',
              adminNotes,
              processedAt: new Date(),
            },
          });

          // تحديث سجل الإيراد
          await tx.platformRevenue.updateMany({
            where: { sourceId: withdrawalId },
            data: {},
          });

          // تحديث المعاملة
          await tx.transaction.updateMany({
            where: {
              type: 'WITHDRAWAL',
              metadata: {
                path: ['withdrawalId'],
                equals: withdrawalId,
              },
            },
            data: { status: 'COMPLETED' },
          });

          // إشعار المستخدم
          await tx.notification.create({
            data: {
              userId: withdrawal.userId,
              type: 'WITHDRAWAL_APPROVED',
              title: 'تمت الموافقة على طلب السحب! ✅',
              content: `تمت الموافقة على طلبك. سيتم تحويل $${withdrawal.netAmount.toFixed(2)} خلال 3-5 أيام عمل.`,
              data: { withdrawalId },
            },
          });

          return updated;
        } else {
          // رفض السحب - إرجاع الألماس
          const wallet = await tx.wallet.findUnique({
            where: { userId: withdrawal.userId },
          });

          if (wallet) {
            // إرجاع الألماس
            await tx.wallet.update({
              where: { userId: withdrawal.userId },
              data: {
                diamondsBalance: { increment: withdrawal.diamondAmount },
                totalWithdrawn: { decrement: withdrawal.diamondAmount },
              },
            });

            // تحديث المعاملة
            await tx.transaction.updateMany({
              where: {
                type: 'WITHDRAWAL',
                metadata: {
                  path: ['withdrawalId'],
                  equals: withdrawalId,
                },
              },
              data: { status: 'CANCELLED' },
            });
          }

          // حذف سجل الإيراد
          await tx.platformRevenue.deleteMany({
            where: { sourceId: withdrawalId },
          });

          // تحديث حالة الطلب
          const updated = await tx.withdrawalRequest.update({
            where: { id: withdrawalId },
            data: {
              status: 'REJECTED',
              adminNotes,
              processedAt: new Date(),
            },
          });

          // إشعار المستخدم
          await tx.notification.create({
            data: {
              userId: withdrawal.userId,
              type: 'WITHDRAWAL_REJECTED',
              title: 'تم رفض طلب السحب',
              content: `تم رفض طلبك. السبب: ${adminNotes || 'لم يُذكر'}. تم إرجاع الألماس لمحفظتك.`,
              data: { withdrawalId },
            },
          });

          return updated;
        }
      });

      return {
        success: true,
        message: action === 'APPROVE' ? 'تمت الموافقة على طلب السحب' : 'تم رفض طلب السحب وإرجاع الألماس',
      };
    } catch (error) {
      console.error('Process withdrawal error:', error);
      return {
        success: false,
        message: 'حدث خطأ أثناء معالجة الطلب',
      };
    }
  }

  /**
   * الحصول على طلبات السحب
   * Get withdrawal requests
   */
  async getWithdrawalRequests(
    options?: {
      userId?: string;
      status?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{
    requests: Array<{
      id: string;
      userId: string;
      user: {
        name: string | null;
        username: string | null;
        email: string;
      };
      diamondAmount: number;
      usdValue: number;
      platformFee: number;
      netAmount: number;
      status: string;
      bankName: string | null;
      createdAt: Date;
      processedAt: Date | null;
    }>;
    total: number;
  }> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (options?.userId) where.userId = options.userId;
    if (options?.status) where.status = options.status;

    const [requests, total] = await Promise.all([
      prisma.withdrawalRequest.findMany({
        where,
        include: {
          user: {
            select: { name: true, username: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.withdrawalRequest.count({ where }),
    ]);

    return {
      requests: requests.map((r) => ({
        id: r.id,
        userId: r.userId,
        user: {
          name: r.user.name,
          username: r.user.username,
          email: r.user.email,
        },
        diamondAmount: r.diamondAmount,
        usdValue: r.usdValue,
        platformFee: r.platformFee,
        netAmount: r.netAmount,
        status: r.status,
        bankName: r.bankName,
        createdAt: r.createdAt,
        processedAt: r.processedAt,
      })),
      total,
    };
  }

  /**
   * إحصائيات إيرادات المنصة
   * Platform revenue statistics
   */
  async getPlatformRevenueStats(): Promise<PlatformRevenueStats> {
    // إجمالي عمولات السحب المكتملة
    const withdrawalRevenue = await prisma.platformRevenue.aggregate({
      where: { source: 'withdrawal_commission' },
      _sum: { netRevenue: true },
    });

    // إحصائيات السحب
    const [pendingWithdrawals, completedWithdrawals] = await Promise.all([
      prisma.withdrawalRequest.count({ where: { status: 'PENDING' } }),
      prisma.withdrawalRequest.count({ where: { status: { in: ['APPROVED', 'PAID'] } } }),
    ]);

    return {
      totalWithdrawalCommission: withdrawalRevenue._sum.netRevenue || 0,
      totalGiftCommission: 0, // سيتم تنفيذها لاحقاً
      totalRevenue: withdrawalRevenue._sum.netRevenue || 0,
      pendingWithdrawals,
      completedWithdrawals,
    };
  }

  /**
   * حساب القيم المالية
   * Calculate financial values
   */
  calculateWithdrawalValues(diamondAmount: number): {
    usdValue: number;
    platformFee: number;
    netAmount: number;
  } {
    const usdValue = diamondAmount / DIAMONDS_PER_USD;
    const platformFee = usdValue * PLATFORM_COMMISSION_RATE;
    const netAmount = usdValue * WRITER_SHARE_RATE;

    return {
      usdValue,
      platformFee,
      netAmount,
    };
  }

  /**
   * تحديث حالة السحب إلى "مدفوع"
   * Mark withdrawal as paid
   */
  async markAsPaid(withdrawalId: string, adminId: string): Promise<WithdrawalResult> {
    try {
      const withdrawal = await prisma.withdrawalRequest.update({
        where: { id: withdrawalId },
        data: {
          status: 'PAID',
          processedAt: new Date(),
        },
      });

      // إشعار المستخدم
      await prisma.notification.create({
        data: {
          userId: withdrawal.userId,
          type: 'WITHDRAWAL_PAID',
          title: 'تم تحويل المبلغ! 💰',
          content: `تم تحويل $${withdrawal.netAmount.toFixed(2)} إلى حسابك البنكي.`,
          data: { withdrawalId },
        },
      });

      return {
        success: true,
        message: 'تم تحديث حالة السحب إلى "مدفوع"',
      };
    } catch (error) {
      console.error('Mark as paid error:', error);
      return {
        success: false,
        message: 'حدث خطأ أثناء تحديث الحالة',
      };
    }
  }
}

// ==================== Singleton Instance ====================

export const withdrawalService = new WithdrawalService();

// ==================== Exports ====================

export default withdrawalService;
