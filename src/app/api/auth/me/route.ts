import { NextRequest } from 'next/server';
import { withAuth, apiResponse, apiError } from '@/lib/api-utils';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const authResult = await withAuth(request);
    if (!authResult.authenticated) {
      return authResult.error;
    }

    const user = await prisma.user.findUnique({
      where: { id: authResult.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        avatar: true,
        bio: true,
        role: true,
        status: true,
        isEmailVerified: true,
        isKycVerified: true,
        createdAt: true,
        wallet: {
          select: {
            coinsBalance: true,
            diamondsBalance: true,
            totalEarned: true,
            totalWithdrawn: true,
          },
        },
        kycVerification: {
          select: {
            status: true,
            idType: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      return apiError('المستخدم غير موجود', 404);
    }

    return apiResponse({ user });
  } catch (error) {
    console.error('Get user error:', error);
    return apiError('حدث خطأ أثناء جلب بيانات المستخدم', 500);
  }
}
