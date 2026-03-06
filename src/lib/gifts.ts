import { prisma } from './db';
import { transferCoinsToDiamonds, getPlatformCommission } from './wallet';

/**
 * الحصول على قائمة الهدايا المتاحة
 */
export async function getAvailableGifts() {
  return prisma.gift.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });
}

/**
 * إرسال هدية لكاتب
 */
export async function sendGift(
  senderId: string,
  receiverId: string,
  giftId: string,
  articleId?: string,
  message?: string
) {
  // الحصول على معلومات الهدية
  const gift = await prisma.gift.findUnique({
    where: { id: giftId },
  });

  if (!gift || !gift.isActive) {
    throw new Error('الهدية غير متاحة');
  }

  // التحقق من أن المستلم كاتب
  const receiver = await prisma.user.findUnique({
    where: { id: receiverId },
  });

  if (!receiver || (receiver.role !== 'WRITER' && receiver.role !== 'ADMIN')) {
    throw new Error('يمكن إرسال الهدايا للكتاب فقط');
  }

  // حساب قيمة الألماس بعد خصم العمولة
  const commission = await getPlatformCommission();
  const diamondValue = Math.floor(gift.diamondValue * (1 - commission));

  // تنفيذ التحويل
  await transferCoinsToDiamonds(
    senderId,
    receiverId,
    gift.coinCost,
    diamondValue,
    giftId,
    articleId,
    message
  );

  // إنشاء إشعار للكاتب
  const sender = await prisma.user.findUnique({
    where: { id: senderId },
  });

  await prisma.notification.create({
    data: {
      userId: receiverId,
      type: 'GIFT_RECEIVED',
      title: 'هدية جديدة! 🎁',
      content: `تلقيت هدية "${gift.nameAr || gift.name}" من ${sender?.name || sender?.username || 'مستخدم'}`,
      data: { giftId, senderId, articleId },
    },
  });

  return {
    success: true,
    gift: {
      name: gift.name,
      nameAr: gift.nameAr,
      icon: gift.icon,
      animation: gift.animation,
    },
  };
}

/**
 * الحصول على الهدايا المستلمة
 */
export async function getReceivedGifts(userId: string, page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit;

  const [gifts, total] = await Promise.all([
    prisma.sentGift.findMany({
      where: { receiverId: userId },
      include: {
        gift: true,
        sender: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
        article: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
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
    gifts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * الحصول على الهدايا المرسلة
 */
export async function getSentGifts(userId: string, page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit;

  const [gifts, total] = await Promise.all([
    prisma.sentGift.findMany({
      where: { senderId: userId },
      include: {
        gift: true,
        receiver: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
        article: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.sentGift.count({
      where: { senderId: userId },
    }),
  ]);

  return {
    gifts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * إحصائيات الهدايا للكاتب
 */
export async function getGiftStats(userId: string) {
  const totalReceived = await prisma.sentGift.count({
    where: { receiverId: userId },
  });

  const totalDiamonds = await prisma.sentGift.aggregate({
    where: { receiverId: userId },
    _sum: {
      gift: {
        diamondValue: true,
      },
    },
  });

  const topGifts = await prisma.sentGift.groupBy({
    by: ['giftId'],
    where: { receiverId: userId },
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: 'desc',
      },
    },
    take: 5,
  });

  const giftDetails = await Promise.all(
    topGifts.map(async (item) => {
      const gift = await prisma.gift.findUnique({
        where: { id: item.giftId },
      });
      return {
        gift,
        count: item._count.id,
      };
    })
  );

  return {
    totalReceived,
    totalDiamonds: totalDiamonds._sum.gift?.diamondValue || 0,
    topGifts: giftDetails,
  };
}
