/**
 * نظام الإحالات والمكافآت لمنصة زايلو
 * Referral and Rewards System for Xylo Platform
 *
 * القواعد:
 * - مكافأة التسجيل: 100 عملة للمُحيل عند تسجيل مستخدم جديد
 * - عمولة الشراء: 50 عملة لكل 1 دولار يشحنه المُحال
 */

import { prisma } from '@/lib/db';

// ==================== Constants ====================

/**
 * مكافأة التسجيل (عملات)
 */
export const SIGNUP_BONUS_COINS = 100;

/**
 * عمولة الشراء (عملة لكل دولار)
 */
export const PURCHASE_COMMISSION_RATE = 50;

/**
 * طول كود الإحالة
 */
export const REFERRAL_CODE_LENGTH = 8;

// ==================== Types ====================

export interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  totalEarnings: number;
  signupBonusEarned: number;
  purchaseCommissionEarned: number;
}

export interface ReferralRewardResult {
  success: boolean;
  message: string;
  reward?: {
    id: string;
    type: string;
    coins: number;
  };
}

// ==================== Service Class ====================

class ReferralService {
  /**
   * إنشاء كود إحالة فريد
   * Generate unique referral code
   */
  generateReferralCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < REFERRAL_CODE_LENGTH; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * إنشاء كود إحالة فريد غير مستخدم
   * Generate unique unused referral code
   */
  async generateUniqueReferralCode(): Promise<string> {
    let code = this.generateReferralCode();
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const existing = await prisma.user.findUnique({
        where: { referralCode: code },
      });

      if (!existing) {
        return code;
      }

      code = this.generateReferralCode();
      attempts++;
    }

    // Fallback: إضافة timestamp
    return `XY${Date.now().toString(36).toUpperCase()}`;
  }

  /**
   * تسجيل إحالة جديدة (عند تسجيل مستخدم جديد)
   * Register new referral (when new user signs up)
   */
  async registerReferral(
    newUserId: string,
    referralCode: string
  ): Promise<ReferralRewardResult> {
    // التحقق من صحة كود الإحالة
    const referrer = await prisma.user.findUnique({
      where: { referralCode: referralCode.toUpperCase() },
    });

    if (!referrer) {
      return {
        success: false,
        message: 'كود الإحالة غير صالح',
      };
    }

    // التحقق من أن المستخدم لم يُحال من قبل
    const newUser = await prisma.user.findUnique({
      where: { id: newUserId },
    });

    if (!newUser) {
      return {
        success: false,
        message: 'المستخدم غير موجود',
      };
    }

    if (newUser.referredById) {
      return {
        success: false,
        message: 'تم ربط هذا المستخدم بكود إحالة مسبقاً',
      };
    }

    // منع إحالة النفس
    if (referrer.id === newUserId) {
      return {
        success: false,
        message: 'لا يمكنك استخدام كود الإحالة الخاص بك',
      };
    }

    // تنفيذ العملية باستخدام Transaction
    try {
      const result = await prisma.$transaction(async (tx) => {
        // 1. ربط المستخدم الجديد بالمُحيل
        await tx.user.update({
          where: { id: newUserId },
          data: { referredById: referrer.id },
        });

        // 2. إنشاء سجل المكافأة
        const reward = await tx.referralReward.create({
          data: {
            referrerId: referrer.id,
            referredUserId: newUserId,
            type: 'SIGNUP_BONUS',
            status: 'AWARDED',
            rewardCoins: SIGNUP_BONUS_COINS,
            awardedAt: new Date(),
          },
        });

        // 3. الحصول على محفظة المُحيل
        let referrerWallet = await tx.wallet.findUnique({
          where: { userId: referrer.id },
        });

        if (!referrerWallet) {
          referrerWallet = await tx.wallet.create({
            data: { userId: referrer.id },
          });
        }

        // 4. إضافة العملات للمُحيل
        await tx.wallet.update({
          where: { userId: referrer.id },
          data: {
            coinsBalance: { increment: SIGNUP_BONUS_COINS },
            totalReferralEarnings: { increment: SIGNUP_BONUS_COINS },
          },
        });

        // 5. إنشاء معاملة
        await tx.transaction.create({
          data: {
            walletId: referrerWallet.id,
            type: 'REFERRAL_BONUS',
            amount: SIGNUP_BONUS_COINS,
            currency: 'COINS',
            status: 'COMPLETED',
            description: `مكافأة تسجيل مستخدم جديد (${newUser.username || newUser.email})`,
            referralRewardId: reward.id,
            metadata: {
              referralType: 'signup_bonus',
              referredUserId: newUserId,
            },
          },
        });

        // 6. إنشاء إشعار للمُحيل
        await tx.notification.create({
          data: {
            userId: referrer.id,
            type: 'REFERRAL_BONUS',
            title: 'مكافأة إحالة جديدة! 🎉',
            content: `حصلت على ${SIGNUP_BONUS_COINS} عملة لمشاركة مستخدم جديد!`,
            data: {
              rewardId: reward.id,
              referredUserId: newUserId,
            },
          },
        });

        return reward;
      });

      return {
        success: true,
        message: `تم منح ${SIGNUP_BONUS_COINS} عملة كمكافأة إحالة`,
        reward: {
          id: result.id,
          type: 'SIGNUP_BONUS',
          coins: SIGNUP_BONUS_COINS,
        },
      };
    } catch (error) {
      console.error('Register referral error:', error);
      return {
        success: false,
        message: 'حدث خطأ أثناء تسجيل الإحالة',
      };
    }
  }

  /**
   * منح عمولة شراء للمُحيل
   * Award purchase commission to referrer
   * 
   * يتم استدعاؤها عند شحن المُحال لعملات
   */
  async awardPurchaseCommission(
    referredUserId: string,
    purchaseAmountUsd: number,
    paymentLogId: string
  ): Promise<ReferralRewardResult> {
    // الحصول على المستخدم المُحال
    const referredUser = await prisma.user.findUnique({
      where: { id: referredUserId },
      include: {
        referrer: true,
      },
    });

    if (!referredUser || !referredUser.referredById || !referredUser.referrer) {
      // لا يوجد مُحيل
      return {
        success: false,
        message: 'لا يوجد مُحيل',
      };
    }

    // حساب العمولة
    const commissionCoins = Math.floor(purchaseAmountUsd * PURCHASE_COMMISSION_RATE);

    if (commissionCoins <= 0) {
      return {
        success: false,
        message: 'قيمة الشراء صغيرة جداً للعمولة',
      };
    }

    const referrerId = referredUser.referredById;

    // تنفيذ باستخدام Transaction
    try {
      const result = await prisma.$transaction(async (tx) => {
        // 1. إنشاء سجل المكافأة
        const reward = await tx.referralReward.create({
          data: {
            referrerId,
            referredUserId,
            type: 'PURCHASE_COMMISSION',
            status: 'AWARDED',
            purchaseAmount: purchaseAmountUsd,
            rewardCoins: commissionCoins,
            paymentLogId,
            awardedAt: new Date(),
          },
        });

        // 2. الحصول على محفظة المُحيل
        let referrerWallet = await tx.wallet.findUnique({
          where: { userId: referrerId },
        });

        if (!referrerWallet) {
          referrerWallet = await tx.wallet.create({
            data: { userId: referrerId },
          });
        }

        // 3. إضافة العملات للمُحيل
        await tx.wallet.update({
          where: { userId: referrerId },
          data: {
            coinsBalance: { increment: commissionCoins },
            totalReferralEarnings: { increment: commissionCoins },
          },
        });

        // 4. إنشاء معاملة
        await tx.transaction.create({
          data: {
            walletId: referrerWallet.id,
            type: 'REFERRAL_BONUS',
            amount: commissionCoins,
            currency: 'COINS',
            status: 'COMPLETED',
            description: `عمولة شراء (${purchaseAmountUsd}$) من مستخدم مُحال`,
            referralRewardId: reward.id,
            metadata: {
              referralType: 'purchase_commission',
              referredUserId,
              purchaseAmountUsd,
            },
          },
        });

        // 5. إنشاء إشعار
        await tx.notification.create({
          data: {
            userId: referrerId,
            type: 'REFERRAL_COMMISSION',
            title: 'عمولة شراء جديدة! 💰',
            content: `حصلت على ${commissionCoins} عملة عمولة من شراء مستخدم مُحال`,
            data: {
              rewardId: reward.id,
              purchaseAmountUsd,
            },
          },
        });

        return reward;
      });

      return {
        success: true,
        message: `تم منح ${commissionCoins} عملة كعمولة شراء`,
        reward: {
          id: result.id,
          type: 'PURCHASE_COMMISSION',
          coins: commissionCoins,
        },
      };
    } catch (error) {
      console.error('Award purchase commission error:', error);
      return {
        success: false,
        message: 'حدث خطأ أثناء منح العمولة',
      };
    }
  }

  /**
   * الحصول على إحصائيات الإحالات
   * Get referral statistics
   */
  async getReferralStats(userId: string): Promise<ReferralStats> {
    // إجمالي الإحالات
    const totalReferrals = await prisma.user.count({
      where: { referredById: userId },
    });

    // الإحالات النشطة (قاموا بالشراء)
    const activeReferrals = await prisma.user.count({
      where: {
        referredById: userId,
        wallet: {
          totalPurchased: { gt: 0 },
        },
      },
    });

    // إجمالي المكافآت
    const rewards = await prisma.referralReward.aggregate({
      where: {
        referrerId: userId,
        status: 'AWARDED',
      },
      _sum: {
        rewardCoins: true,
      },
    });

    // مكافآت التسجيل
    const signupBonus = await prisma.referralReward.aggregate({
      where: {
        referrerId: userId,
        type: 'SIGNUP_BONUS',
        status: 'AWARDED',
      },
      _sum: {
        rewardCoins: true,
      },
    });

    // عمولات الشراء
    const purchaseCommission = await prisma.referralReward.aggregate({
      where: {
        referrerId: userId,
        type: 'PURCHASE_COMMISSION',
        status: 'AWARDED',
      },
      _sum: {
        rewardCoins: true,
      },
    });

    return {
      totalReferrals,
      activeReferrals,
      totalEarnings: rewards._sum.rewardCoins || 0,
      signupBonusEarned: signupBonus._sum.rewardCoins || 0,
      purchaseCommissionEarned: purchaseCommission._sum.rewardCoins || 0,
    };
  }

  /**
   * الحصول على قائمة الإحالات
   * Get referral list
   */
  async getReferralList(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    referrals: Array<{
      id: string;
      username: string | null;
      name: string | null;
      avatar: string | null;
      createdAt: Date;
      totalPurchased: number;
      totalCommission: number;
    }>;
    total: number;
    hasMore: boolean;
  }> {
    const skip = (page - 1) * limit;

    const [referrals, total] = await Promise.all([
      prisma.user.findMany({
        where: { referredById: userId },
        select: {
          id: true,
          username: true,
          name: true,
          avatar: true,
          createdAt: true,
          wallet: {
            select: {
              totalPurchased: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({
        where: { referredById: userId },
      }),
    ]);

    // الحصول على إجمالي العمولات لكل مُحال
    const referralIds = referrals.map((r) => r.id);
    const commissions = await prisma.referralReward.groupBy({
      by: ['referredUserId'],
      where: {
        referrerId: userId,
        referredUserId: { in: referralIds },
        type: 'PURCHASE_COMMISSION',
        status: 'AWARDED',
      },
      _sum: {
        rewardCoins: true,
      },
    });

    const commissionMap = new Map(
      commissions.map((c) => [c.referredUserId, c._sum.rewardCoins || 0])
    );

    return {
      referrals: referrals.map((r) => ({
        id: r.id,
        username: r.username,
        name: r.name,
        avatar: r.avatar,
        createdAt: r.createdAt,
        totalPurchased: r.wallet?.totalPurchased || 0,
        totalCommission: commissionMap.get(r.id) || 0,
      })),
      total,
      hasMore: total > skip + limit,
    };
  }

  /**
   * الحصول على أفضل المُحيلين
   * Get top referrers (for admin dashboard)
   */
  async getTopReferrers(limit: number = 10): Promise<
    Array<{
      id: string;
      username: string | null;
      name: string | null;
      avatar: string | null;
      totalReferrals: number;
      totalEarnings: number;
    }>
  > {
    // الحصول على إحصائيات كل مُحيل
    const referrers = await prisma.user.findMany({
      where: {
        referrals: { some: {} },
      },
      select: {
        id: true,
        username: true,
        name: true,
        avatar: true,
        _count: {
          select: { referrals: true },
        },
        wallet: {
          select: {
            totalReferralEarnings: true,
          },
        },
      },
      orderBy: {
        wallet: {
          totalReferralEarnings: 'desc',
        },
      },
      take: limit,
    });

    return referrers.map((r) => ({
      id: r.id,
      username: r.username,
      name: r.name,
      avatar: r.avatar,
      totalReferrals: r._count.referrals,
      totalEarnings: r.wallet?.totalReferralEarnings || 0,
    }));
  }

  /**
   * التحقق من صحة كود الإحالة
   * Validate referral code
   */
  async validateReferralCode(code: string): Promise<{
    valid: boolean;
    referrer?: {
      id: string;
      name: string | null;
      username: string | null;
    };
  }> {
    const referrer = await prisma.user.findUnique({
      where: { referralCode: code.toUpperCase() },
      select: {
        id: true,
        name: true,
        username: true,
      },
    });

    if (!referrer) {
      return { valid: false };
    }

    return {
      valid: true,
      referrer,
    };
  }
}

// ==================== Singleton Instance ====================

export const referralService = new ReferralService();

// ==================== Exports ====================

export default referralService;
