import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { quscoinToUSD, WITHDRAWAL_SETTINGS } from '@/lib/constants';

// Get wallet info
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const wallet = await db.wallet.findUnique({
      where: { userId: user.id },
    });

    if (!wallet) {
      return NextResponse.json({ error: 'المحفظة غير موجودة' }, { status: 404 });
    }

    // Get recent transactions
    const transactions = await db.transaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({
      wallet: {
        ...wallet,
        quscoinUSDValue: quscoinToUSD(wallet.quscoinBalance),
      },
      transactions,
    });
  } catch (error) {
    console.error('Get wallet error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب بيانات المحفظة' },
      { status: 500 }
    );
  }
}

// Request withdrawal
const withdrawalSchema = z.object({
  amount: z.number().min(WITHDRAWAL_SETTINGS.MIN_AMOUNT_QUSCOIN, 
    `الحد الأدنى للسحب هو ${WITHDRAWAL_SETTINGS.MIN_AMOUNT_QUSCOIN} QUSCOIN`),
  method: z.enum(['STRIPE', 'PAYPAL', 'MOYASAR', 'STC_PAY', 'PAYONEER', 'SKRILL']),
  accountInfo: z.string().min(1, 'معلومات الحساب مطلوبة'),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const { amount, method, accountInfo } = withdrawalSchema.parse(body);

    const wallet = await db.wallet.findUnique({
      where: { userId: user.id },
    });

    if (!wallet || wallet.quscoinBalance < amount) {
      return NextResponse.json(
        { error: 'رصيد QUSCOIN غير كافٍ' },
        { status: 400 }
      );
    }

    const usdAmount = quscoinToUSD(amount);

    // Create withdrawal request
    const withdrawal = await db.$transaction(async (tx) => {
      // Deduct from wallet
      await tx.wallet.update({
        where: { userId: user.id },
        data: {
          quscoinBalance: { decrement: amount },
        },
      });

      // Create withdrawal request
      const wr = await tx.withdrawalRequest.create({
        data: {
          userId: user.id,
          amount,
          usdAmount,
          method,
          accountInfo,
          status: 'PENDING',
        },
      });

      // Record transaction
      await tx.transaction.create({
        data: {
          userId: user.id,
          type: 'WITHDRAWAL',
          amount,
          currency: 'QUSCOIN',
          description: `طلب سحب عبر ${method}`,
          status: 'PENDING',
        },
      });

      return wr;
    });

    return NextResponse.json({
      success: true,
      withdrawal,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error('Withdrawal error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء طلب السحب' },
      { status: 500 }
    );
  }
}
