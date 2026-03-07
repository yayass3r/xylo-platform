import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { WithdrawalStatus } from '@prisma/client';

/**
 * POST /api/admin/withdrawals/[id]/approve
 * الموافقة على طلب سحب
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

    const updated = await prisma.withdrawalRequest.update({
      where: { id },
      data: {
        status: WithdrawalStatus.APPROVED,
        processedAt: new Date(),
      },
    });

    await prisma.platformRevenue.create({
      data: {
        source: 'withdrawal_commission',
        sourceId: id,
        grossAmount: withdrawal.usdValue,
        commissionRate: 0.10,
        netRevenue: withdrawal.platformFee,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'تم الموافقة على طلب السحب',
      data: { id: updated.id, status: updated.status },
    });
  } catch (error) {
    console.error('Approve withdrawal error:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء معالجة الطلب' },
      { status: 500 }
    );
  }
}
