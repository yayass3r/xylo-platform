import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// ثابت: 100 ألماس = 1 دولار
const DIAMONDS_PER_DOLLAR = 100;
const PLATFORM_FEE_PERCENTAGE = 0.10; // 10% عمولة

/**
 * POST /api/wallet/withdraw
 * طلب سحب أرباح
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, message: 'جلسة غير صالحة' }, { status: 401 });
    }

    const body = await request.json();
    const { diamondAmount, withdrawalMethod, accountDetails } = body;

    // التحقق من البيانات
    if (!diamondAmount || diamondAmount < 100) {
      return NextResponse.json(
        { success: false, message: 'الحد الأدنى للسحب هو 100 ألماس' },
        { status: 400 }
      );
    }

    if (!withdrawalMethod || !accountDetails) {
      return NextResponse.json(
        { success: false, message: 'بيانات غير مكتملة' },
        { status: 400 }
      );
    }

    // جلب المحفظة
    const wallet = await prisma.wallet.findUnique({
      where: { userId: payload.userId },
    });

    if (!wallet || wallet.diamondsBalance < diamondAmount) {
      return NextResponse.json(
        { success: false, message: 'رصيد الألماس غير كافٍ' },
        { status: 400 }
      );
    }

    // حساب القيم
    const usdValue = diamondAmount / DIAMONDS_PER_DOLLAR;
    const platformFee = usdValue * PLATFORM_FEE_PERCENTAGE;
    const netAmount = usdValue - platformFee;

    // إنشاء طلب السحب وخصم الرصيد في معاملة واحدة
    const result = await prisma.$transaction(async (tx) => {
      // إنشاء طلب السحب
      const withdrawal = await tx.withdrawalRequest.create({
        data: {
          userId: payload.userId,
          diamondAmount,
          usdValue,
          platformFee,
          netAmount,
          bankName: withdrawalMethod,
          bankAccount: accountDetails,
          status: 'PENDING',
        },
      });

      // خصم من رصيد الألماس
      await tx.wallet.update({
        where: { userId: payload.userId },
        data: {
          diamondsBalance: { decrement: diamondAmount },
        },
      });

      // تسجيل المعاملة
      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'WITHDRAWAL',
          amount: diamondAmount,
          currency: 'DIAMONDS',
          status: 'PENDING',
          description: `طلب سحب - ${withdrawalMethod}`,
          metadata: {
            withdrawalId: withdrawal.id,
            usdValue,
            netAmount,
          },
        },
      });

      return withdrawal;
    });

    return NextResponse.json({
      success: true,
      message: 'تم تقديم طلب السحب بنجاح',
      data: {
        id: result.id,
        diamondAmount: result.diamondAmount,
        usdValue: result.usdValue,
        netAmount: result.netAmount,
        status: result.status,
      },
    });
  } catch (error) {
    console.error('Withdrawal error:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء معالجة الطلب' },
      { status: 500 }
    );
  }
}
