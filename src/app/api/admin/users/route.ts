import { NextRequest } from 'next/server';
import { withAdminAuth, apiResponse, apiError, getPaginationParams } from '@/lib/api-utils';
import { prisma } from '@/lib/db';

// GET: قائمة المستخدمين
export async function GET(request: NextRequest) {
  try {
    const authResult = await withAdminAuth(request);
    if (!authResult.authenticated) {
      return authResult.error;
    }

    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = getPaginationParams(request);

    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {};

    if (role) {
      where.role = role;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          username: true,
          avatar: true,
          role: true,
          status: true,
          isEmailVerified: true,
          isKycVerified: true,
          createdAt: true,
          _count: {
            select: {
              articles: true,
              receivedGifts: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return apiResponse({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    return apiError('حدث خطأ أثناء جلب المستخدمين', 500);
  }
}
