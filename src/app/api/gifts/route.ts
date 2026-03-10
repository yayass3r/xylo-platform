import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { malcoinToQuscoin } from '@/lib/constants';

// Get available gifts
export async function GET() {
  try {
    const gifts = await db.gift.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ gifts });
  } catch (error) {
    console.error('Get gifts error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب الهدايا' },
      { status: 500 }
    );
  }
}

// Send gift
const sendGiftSchema = z.object({
  giftId: z.string(),
  receiverId: z.string(),
  articleId: z.string().optional(),
  message: z.string().max(200).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const { giftId, receiverId, articleId, message } = sendGiftSchema.parse(body);

    // Get gift
    const gift = await db.gift.findUnique({
      where: { id: giftId },
    });

    if (!gift || !gift.isActive) {
      return NextResponse.json({ error: 'الهدية غير موجودة' }, { status: 404 });
    }

    // Check sender wallet
    const senderWallet = await db.wallet.findUnique({
      where: { userId: user.id },
    });

    if (!senderWallet || senderWallet.malcoinBalance < gift.cost) {
      return NextResponse.json(
        { error: 'رصيد MALCOIN غير كافٍ' },
        { status: 400 }
      );
    }

    // Check receiver exists
    const receiver = await db.user.findUnique({
      where: { id: receiverId },
    });

    if (!receiver) {
      return NextResponse.json({ error: 'المستلم غير موجود' }, { status: 404 });
    }

    // Calculate QUSCOIN value (80% for receiver)
    const quscoinValue = malcoinToQuscoin(gift.cost);

    // Create transaction and update wallets
    const giftTransaction = await db.$transaction(async (tx) => {
      // Deduct from sender
      await tx.wallet.update({
        where: { userId: user.id },
        data: {
          malcoinBalance: { decrement: gift.cost },
        },
      });

      // Add to receiver
      await tx.wallet.update({
        where: { userId: receiverId },
        data: {
          quscoinBalance: { increment: quscoinValue },
          totalEarned: { increment: quscoinValue },
        },
      });

      // Record gift transaction
      const gt = await tx.giftTransaction.create({
        data: {
          giftId,
          senderId: user.id,
          receiverId,
          articleId,
          message,
          malcoinValue: gift.cost,
          quscoinValue,
        },
      });

      // Record transactions for both users
      await tx.transaction.create({
        data: {
          userId: user.id,
          type: 'GIFT_SENT',
          amount: gift.cost,
          currency: 'MALCOIN',
          description: `إرسال ${gift.nameAr} إلى ${receiver.name || receiver.email}`,
        },
      });

      await tx.transaction.create({
        data: {
          userId: receiverId,
          type: 'GIFT_RECEIVED',
          amount: quscoinValue,
          currency: 'QUSCOIN',
          description: `استلام ${gift.nameAr} من ${user.name || user.email}`,
        },
      });

      // Update article gift stats
      if (articleId) {
        await tx.article.update({
          where: { id: articleId },
          data: {
            giftCount: { increment: 1 },
            giftValue: { increment: gift.cost },
          },
        });
      }

      // Create notification
      await tx.notification.create({
        data: {
          userId: receiverId,
          type: 'GIFT_RECEIVED',
          title: 'هدية جديدة! 🎁',
          message: `${user.name || user.email} أرسل لك ${gift.nameAr}`,
          data: JSON.stringify({ giftId, articleId }),
        },
      });

      return gt;
    });

    return NextResponse.json({
      success: true,
      giftTransaction,
      quscoinValue,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error('Send gift error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إرسال الهدية' },
      { status: 500 }
    );
  }
}
