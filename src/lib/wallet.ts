import { prisma } from './db';

/**
 * الحصول على محفظة المستخدم
 */
export async function getWallet(userId: string) {
  return prisma.wallet.findUnique({
    where: { userId },
    include: {
      transactions: {
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
    },
  });
}

/**
 * إضافة عملات للمحفظة (بعد الشراء)
 */
export async function addCoins(
  userId: string,
  amount: number,
  paymentReference: string,
  paymentMethod: string = 'STRIPE'
) {
  return prisma.$transaction(async (tx) => {
    // الحصول على المحفظة
    let wallet = await tx.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      wallet = await tx.wallet.create({
        data: { userId },
      });
    }

    // تحديث رصيد العملات
    await tx.wallet.update({
      where: { userId },
      data: {
        coinsBalance: { increment: amount },
      },
    });

    // إنشاء معاملة
    await tx.transaction.create({
      data: {
        walletId: wallet.id,
        type: 'PURCHASE',
        amount,
        currency: 'USD',
        status: 'COMPLETED',
        paymentMethod,
        paymentReference,
        description: `شراء ${amount} عملة`,
      },
    });

    return { success: true, newBalance: wallet.coinsBalance + amount };
  });
}

/**
 * خصم عملات من محفظة القارئ وإضافة ألماس للكاتب
 */
export async function transferCoinsToDiamonds(
  senderId: string,
  receiverId: string,
  coinsAmount: number,
  diamondsAmount: number,
  giftId: string,
  articleId?: string,
  message?: string
) {
  return prisma.$transaction(async (tx) => {
    // التحقق من رصيد المرسل
    const senderWallet = await tx.wallet.findUnique({
      where: { userId: senderId },
    });

    if (!senderWallet || senderWallet.coinsBalance < coinsAmount) {
      throw new Error('رصيد غير كافي');
    }

    // خصم العملات من المرسل
    await tx.wallet.update({
      where: { userId: senderId },
      data: {
        coinsBalance: { decrement: coinsAmount },
      },
    });

    // الحصول على محفظة المستلم أو إنشاؤها
    let receiverWallet = await tx.wallet.findUnique({
      where: { userId: receiverId },
    });

    if (!receiverWallet) {
      receiverWallet = await tx.wallet.create({
        data: { userId: receiverId },
      });
    }

    // إضافة الألماس للمستلم
    await tx.wallet.update({
      where: { userId: receiverId },
      data: {
        diamondsBalance: { increment: diamondsAmount },
        totalEarned: { increment: diamondsAmount },
      },
    });

    // إنشاء سجل الهدية المرسلة
    await tx.sentGift.create({
      data: {
        giftId,
        senderId,
        receiverId,
        articleId,
        message,
      },
    });

    // إنشاء معاملات
    await tx.transaction.createMany({
      data: [
        {
          walletId: senderWallet.id,
          type: 'TIP',
          amount: coinsAmount,
          currency: 'COINS',
          status: 'COMPLETED',
          description: `إرسال هدية بقيمة ${coinsAmount} عملة`,
          metadata: { receiverId, giftId, articleId },
        },
      ],
    });

    return { success: true };
  });
}

/**
 * طلب سحب أرباح
 */
export async function requestWithdrawal(
  userId: string,
  amount: number,
  bankDetails: {
    bankName: string;
    bankAccount: string;
    accountHolderName: string;
  }
) {
  return prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({
      where: { userId },
    });

    if (!wallet || wallet.diamondsBalance < amount) {
      throw new Error('رصيد الألماس غير كافي');
    }

    // الحصول على الحد الأدنى للسحب من الإعدادات
    const minWithdrawalSetting = await tx.systemSetting.findUnique({
      where: { key: 'min_withdrawal_amount' },
    });
    const minWithdrawal = minWithdrawalSetting ? parseInt(minWithdrawalSetting.value) : 1000;

    if (amount < minWithdrawal) {
      throw new Error(`الحد الأدنى للسحب هو ${minWithdrawal} ألماس`);
    }

    // خصم من الرصيد
    await tx.wallet.update({
      where: { userId },
      data: {
        diamondsBalance: { decrement: amount },
      },
    });

    // إنشاء طلب السحب
    const withdrawal = await tx.withdrawalRequest.create({
      data: {
        userId,
        amount,
        currency: 'USD',
        bankName: bankDetails.bankName,
        bankAccount: bankDetails.bankAccount,
        accountHolderName: bankDetails.accountHolderName,
        status: 'PENDING',
      },
    });

    return withdrawal;
  });
}

/**
 * الحصول على معدل تحويل الألماس للدولار
 */
export async function getDiamondToUsdRate(): Promise<number> {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: 'diamond_to_usd_rate' },
  });
  return setting ? parseFloat(setting.value) : 0.01; // الافتراضي: 100 ألماس = 1 دولار
}

/**
 * الحصول على عمولة المنصة
 */
export async function getPlatformCommission(): Promise<number> {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: 'platform_commission' },
  });
  return setting ? parseFloat(setting.value) : 0.30; // الافتراضي: 30%
}
