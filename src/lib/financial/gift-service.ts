/**
 * نظام الهدايا والدعم المالي لمنصة زايلو
 * Gifting and Tipping System for Xylo Platform
 *
 * القواعد:
 * - 1 عملة = 1 ألماسة (للكاتب)
 * - استخدام Database Transactions (ACID) لضمان الأمان
 * - تسجيل كامل للعمليات
 */

import { prisma } from '@/lib/db';
import { referralService } from '@/lib/referral/referral-service';

// ==================== Types ====================

export interface SendGiftResult {
  success: boolean;
  message: string;
  gift?: {
    id: string;
    name: string;
    nameAr: string | null;
    icon: string;
    coinCost: number;
  };
  transaction?: {
    id: string;
    coinsDeducted: number;
    diamondsAwarded: number;
    newSenderBalance: number;
    newReceiverBalance: number;
  };
}

export interface GiftStats {
  totalSent: number;
  totalReceived: number;
  totalCoinsSpent: number;
  totalDiamondsEarned: number;
  topGifts: Array<{
    gift: {
      id: string;
      name: string;
      nameAr: string | null;
      icon: string;
    };
    count: number;
  }>;
}

// ==================== Service Class ====================

class GiftService {
  /**
   * إرسال هدية لكاتب (مع ACID Transaction)
   * Send gift to writer (with ACID Transaction)
   * 
   * هذه العملة حرجة مالياً - يجب أن تتم في Transaction واحد
   */
  async sendGift(
    senderId: string,
    receiverId: string,
    giftId: string,
    options?: {
      articleId?: string;
      message?: string;
    }
  ): Promise<SendGiftResult> {
    // التحقق من عدم إرسال هدية للنفس
    if (senderId === receiverId) {
      return {
        success: false,
        message: 'لا يمكنك إرسال هدية لنفسك',
      };
    }

    // التحقق من أن المستلم كاتب
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
    });

    if (!receiver) {
      return {
        success: false,
        message: 'المستلم غير موجود',
      };
    }

    if (receiver.role !== 'WRITER' && receiver.role !== 'ADMIN') {
      return {
        success: false,
        message: 'يمكن إرسال الهدايا للكتاب فقط',
      };
    }

    // الحصول على معلومات الهدية
    const gift = await prisma.gift.findUnique({
      where: { id: giftId },
    });

    if (!gift || !gift.isActive) {
      return {
        success: false,
        message: 'الهدية غير متاحة',
      };
    }

    // ========== ACID TRANSACTION ==========
    // كل العمليات التالية تتم كوحدة واحدة
    // إذا فشلت أي عملية، يتم التراجع عن الكل (Rollback)
    try {
      const result = await prisma.$transaction(async (tx) => {
        // 1. الحصول على محفظة المرسل
        let senderWallet = await tx.wallet.findUnique({
          where: { userId: senderId },
        });

        if (!senderWallet) {
          senderWallet = await tx.wallet.create({
            data: { userId: senderId },
          });
        }

        // 2. التحقق من رصيد المرسل
        if (senderWallet.coinsBalance < gift.coinCost) {
          throw new Error('INSUFFICIENT_BALANCE');
        }

        // 3. الحصول على محفظة المستلم
        let receiverWallet = await tx.wallet.findUnique({
          where: { userId: receiverId },
        });

        if (!receiverWallet) {
          receiverWallet = await tx.wallet.create({
            data: { userId: receiverId },
          });
        }

        // 4. خصم العملات من المرسل (Atomic)
        const updatedSenderWallet = await tx.wallet.update({
          where: { userId: senderId },
          data: {
            coinsBalance: { decrement: gift.coinCost },
            totalSpent: { increment: gift.coinCost },
          },
        });

        // 5. إضافة الألماس للمستلم (Atomic)
        // 1 عملة = 1 ألماسة
        const diamondsToAdd = gift.diamondValue;
        const updatedReceiverWallet = await tx.wallet.update({
          where: { userId: receiverId },
          data: {
            diamondsBalance: { increment: diamondsToAdd },
            totalEarned: { increment: diamondsToAdd },
          },
        });

        // 6. إنشاء سجل الهدية المرسلة
        const sentGift = await tx.sentGift.create({
          data: {
            giftId,
            senderId,
            receiverId,
            articleId: options?.articleId,
            message: options?.message,
            coinAmount: gift.coinCost,
            diamondAmount: diamondsToAdd,
          },
        });

        // 7. إنشاء معاملة للمرسل
        await tx.transaction.create({
          data: {
            walletId: senderWallet.id,
            type: 'TIP',
            amount: gift.coinCost,
            currency: 'COINS',
            status: 'COMPLETED',
            description: `إرسال هدية "${gift.nameAr || gift.name}"`,
            metadata: {
              giftId,
              giftName: gift.name,
              receiverId,
              articleId: options?.articleId,
              sentGiftId: sentGift.id,
            },
          },
        });

        // 8. إنشاء إشعار للمستلم
        await tx.notification.create({
          data: {
            userId: receiverId,
            type: 'GIFT_RECEIVED',
            title: `收到礼物! 🎁`, // "حصلت على هدية!"
            content: `تلقيت هدية "${gift.nameAr || gift.name}" (${diamondsToAdd} 💎)`,
            data: {
              giftId,
              senderId,
              sentGiftId: sentGift.id,
            },
          },
        });

        return {
          sentGiftId: sentGift.id,
          coinsDeducted: gift.coinCost,
          diamondsAwarded: diamondsToAdd,
          newSenderBalance: updatedSenderWallet.coinsBalance,
          newReceiverBalance: updatedReceiverWallet.diamondsBalance,
        };
      });

      return {
        success: true,
        message: `تم إرسال الهدية بنجاح! 🎁`,
        gift: {
          id: gift.id,
          name: gift.name,
          nameAr: gift.nameAr,
          icon: gift.icon,
          coinCost: gift.coinCost,
        },
        transaction: {
          id: result.sentGiftId,
          coinsDeducted: result.coinsDeducted,
          diamondsAwarded: result.diamondsAwarded,
          newSenderBalance: result.newSenderBalance,
          newReceiverBalance: result.newReceiverBalance,
        },
      };
    } catch (error) {
      if (error instanceof Error && error.message === 'INSUFFICIENT_BALANCE') {
        return {
          success: false,
          message: 'رصيدك غير كافٍ لإرسال هذه الهدية',
        };
      }

      console.error('Send gift error:', error);
      return {
        success: false,
        message: 'حدث خطأ أثناء إرسال الهدية. يرجى المحاولة مرة أخرى.',
      };
    }
  }

  /**
   * الحصول على قائمة الهدايا المتاحة
   * Get available gifts
   */
  async getAvailableGifts(): Promise<
    Array<{
      id: string;
      name: string;
      nameAr: string | null;
      icon: string;
      animation: string | null;
      coinCost: number;
      diamondValue: number;
    }>
  > {
    const gifts = await prisma.gift.findMany({
      where: { isActive: true },
      orderBy: { coinCost: 'asc' },
    });

    return gifts.map((g) => ({
      id: g.id,
      name: g.name,
      nameAr: g.nameAr,
      icon: g.icon,
      animation: g.animation,
      coinCost: g.coinCost,
      diamondValue: g.diamondValue,
    }));
  }

  /**
   * الحصول على الهدايا المستلمة
   * Get received gifts
   */
  async getReceivedGifts(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    gifts: Array<{
      id: string;
      gift: {
        name: string;
        nameAr: string | null;
        icon: string;
      };
      sender: {
        id: string;
        name: string | null;
        username: string | null;
        avatar: string | null;
      };
      article: {
        id: string;
        title: string;
      } | null;
      message: string | null;
      coinAmount: number;
      diamondAmount: number;
      createdAt: Date;
    }>;
    total: number;
    hasMore: boolean;
  }> {
    const skip = (page - 1) * limit;

    const [gifts, total] = await Promise.all([
      prisma.sentGift.findMany({
        where: { receiverId: userId },
        include: {
          gift: {
            select: { name: true, nameAr: true, icon: true },
          },
          sender: {
            select: { id: true, name: true, username: true, avatar: true },
          },
          article: {
            select: { id: true, title: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.sentGift.count({
        where: { receiverId: userId },
      }),
    ]);

    return {
      gifts: gifts.map((g) => ({
        id: g.id,
        gift: {
          name: g.gift.name,
          nameAr: g.gift.nameAr,
          icon: g.gift.icon,
        },
        sender: {
          id: g.sender.id,
          name: g.sender.name,
          username: g.sender.username,
          avatar: g.sender.avatar,
        },
        article: g.article
          ? {
              id: g.article.id,
              title: g.article.title,
            }
          : null,
        message: g.message,
        coinAmount: g.coinAmount,
        diamondAmount: g.diamondAmount,
        createdAt: g.createdAt,
      })),
      total,
      hasMore: total > skip + limit,
    };
  }

  /**
   * الحصول على إحصائيات الهدايا
   * Get gift statistics
   */
  async getGiftStats(userId: string): Promise<GiftStats> {
    // الهدايا المرسلة
    const sentStats = await prisma.sentGift.aggregate({
      where: { senderId: userId },
      _count: true,
      _sum: { coinAmount: true },
    });

    // الهدايا المستلمة
    const receivedStats = await prisma.sentGift.aggregate({
      where: { receiverId: userId },
      _count: true,
      _sum: { diamondAmount: true },
    });

    // أكثر الهدايا المرسلة
    const topGiftsSent = await prisma.sentGift.groupBy({
      by: ['giftId'],
      where: { senderId: userId },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    const topGifts = await Promise.all(
      topGiftsSent.map(async (item) => {
        const gift = await prisma.gift.findUnique({
          where: { id: item.giftId },
          select: { id: true, name: true, nameAr: true, icon: true },
        });
        return {
          gift: gift || { id: item.giftId, name: 'Unknown', nameAr: null, icon: '🎁' },
          count: item._count.id,
        };
      })
    );

    return {
      totalSent: sentStats._count,
      totalReceived: receivedStats._count,
      totalCoinsSpent: sentStats._sum.coinAmount || 0,
      totalDiamondsEarned: receivedStats._sum.diamondAmount || 0,
      topGifts,
    };
  }

  /**
   * إنشاء الهدايا الافتراضية
   * Seed default gifts
   */
  async seedDefaultGifts(): Promise<void> {
    const defaultGifts = [
      { id: 'gift-heart', name: 'Heart', nameAr: 'قلب', icon: '❤️', coinCost: 10, diamondValue: 10 },
      { id: 'gift-star', name: 'Star', nameAr: 'نجمة', icon: '⭐', coinCost: 50, diamondValue: 50 },
      { id: 'gift-rose', name: 'Rose', nameAr: 'وردة', icon: '🌹', coinCost: 100, diamondValue: 100 },
      { id: 'gift-crown', name: 'Crown', nameAr: 'تاج', icon: '👑', coinCost: 500, diamondValue: 500 },
      { id: 'gift-rocket', name: 'Rocket', nameAr: 'صاروخ', icon: '🚀', coinCost: 1000, diamondValue: 1000 },
      { id: 'gift-party', name: 'Party', nameAr: 'احتفال', icon: '🎉', coinCost: 5000, diamondValue: 5000 },
    ];

    for (const gift of defaultGifts) {
      await prisma.gift.upsert({
        where: { id: gift.id },
        update: {
          name: gift.name,
          nameAr: gift.nameAr,
          icon: gift.icon,
          coinCost: gift.coinCost,
          diamondValue: gift.diamondValue,
          isActive: true,
        },
        create: {
          id: gift.id,
          name: gift.name,
          nameAr: gift.nameAr,
          icon: gift.icon,
          coinCost: gift.coinCost,
          diamondValue: gift.diamondValue,
          isActive: true,
        },
      });
    }
  }
}

// ==================== Singleton Instance ====================

export const giftService = new GiftService();

// ==================== Exports ====================

export default giftService;
