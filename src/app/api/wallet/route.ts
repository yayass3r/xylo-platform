import { NextRequest } from 'next/server';
import { withAuth, apiResponse, apiError } from '@/lib/api-utils';
import { prisma } from '@/lib/db';

// GET: رصيد المحفظة
export async function GET(request: NextRequest) {
  try {
    const authResult = await withAuth(request);
    if (!authResult.authenticated) {
      return authResult.error;
    }

    const wallet = await prisma.wallet.findUnique({
      where: { userId: authResult.user!.id },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!wallet) {
      // إنشاء محفظة إن لم تكن موجودة
      const newWallet = await prisma.wallet.create({
        data: { userId: authResult.user!.id },
        include: {
          transactions: true,
        },
      });
      return apiResponse({ wallet: newWallet });
    }

    return apiResponse({ wallet });
  } catch (error) {
    console.error('Get wallet error:', error);
    return apiError('حدث خطأ أثناء جلب بيانات المحفظة', 500);
  }
}
