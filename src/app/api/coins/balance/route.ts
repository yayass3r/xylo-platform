import { NextRequest } from 'next/server';
import { withAuth, apiResponse, apiError } from '@/lib/api-utils';
import { coinsService } from '@/lib/financial/coins-service';

/**
 * GET: الحصول على رصيد المحفظة
 */
export async function GET(request: NextRequest) {
  const authResult = await withAuth(request);
  if (!authResult.authenticated) {
    return authResult.error;
  }

  try {
    const balance = await coinsService.getBalance(authResult.user!.id);
    return apiResponse({ balance });
  } catch (error) {
    console.error('Get balance error:', error);
    return apiError('فشل في جلب الرصيد', 500);
  }
}
