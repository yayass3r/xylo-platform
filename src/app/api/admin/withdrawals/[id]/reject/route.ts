import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { WithdrawalStatus } from '@prisma/client';

/**
 * POST /api/admin/withdrawals/[id]/reject
 * رفض طلب سحب
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 403 });
    }

    const { id } = await params;

    const withdrawal = await prisma.withdrawalRequest.findUnique({
      where: { id },
    });

    if (!withdrawal) {
      return NextResponse.json({ success: false, message: 'طلب السحب غير موجود' }, { status: 404 });
    }

    if (withdrawal.status !== 'PENDING') {
      return NextResponse.json({ success: false, message: 'تم معالجة هذا الطلب مسبقاً' }, { status: 400 });
    }

    await prisma.wallet.update({
      where: { userId: withdrawal.userId },
      data: {
        diamondsBalance: { increment: withdrawal.diamondAmount },
      },
    });

    const updated = await prisma.withdrawalRequest.update({
      where: { id },
      data: {
        status: WithdrawalStatus.REJECTED,
        processedAt: new Date(),
        adminNotes: 'تم رفض الطلب من قبل الإدارة',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'تم رفض طلب السحب وإرجاع الألماس للمستخدم',
      data: { id: updated.id, status: updated.status },
    });
  } catch (error) {
    console.error('Reject withdrawal error:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء معالجة الطلب' },
      { status: 500 }
    );
  }
}
