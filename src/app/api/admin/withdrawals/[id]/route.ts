import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { getPaginationParams } from '@/lib/api-utils';

import { WithdrawalStatus } from '@prisma/client';

/**
 * GET /api/admin/withdrawals
 * جلب طلبات السحب
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 403 });
    }

    const { page, limit, skip } = getPaginationParams(request);
    const status = request.nextUrl.searchParams.get('status') as WithdrawalStatus | null;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [withdrawals, totalCount] = await Promise.all([
      prisma.withdrawalRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.withdrawalRequest.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: withdrawals.map((w) => ({
        id: w.id,
        userId: w.userId,
        user: {
          name: w.user.name,
          email: w.user.email,
        },
        diamondAmount: w.diamondAmount,
        usdValue: w.usdValue,
        netAmount: w.netAmount,
        platformFee: w.platformFee,
        status: w.status,
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
    console.error('Admin withdrawals error:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء جلب طلبات السحب' },
      { status: 500 }
    );
  }
}
