import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { getPaginationParams } from '@/lib/api-utils';

/**
 * GET /api/writer/withdrawals
 * سجل سحوبات الكاتب
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, message: 'جلسة غير صالحة' }, { status: 401 });
    }

    const { page, limit, skip } = getPaginationParams(request);

    const [withdrawals, totalCount] = await Promise.all([
      prisma.withdrawalRequest.findMany({
        where: { userId: payload.userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.withdrawalRequest.count({ where: { userId: payload.userId } }),
    ]);

    return NextResponse.json({
      success: true,
      data: withdrawals.map(w => ({
        id: w.id,
        diamondAmount: w.diamondAmount,
        usdValue: w.usdValue,
        platformFee: w.platformFee,
        netAmount: w.netAmount,
        status: w.status,
        adminNotes: w.adminNotes,
        processedAt: w.processedAt,
        createdAt: w.createdAt,
      })),
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Writer withdrawals error:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء جلب السحوبات' },
      { status: 500 }
    );
  }
}
