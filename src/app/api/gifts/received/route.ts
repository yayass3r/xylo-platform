import { NextRequest } from 'next/server';
import { withAuth, apiResponse, apiError, getPaginationParams } from '@/lib/api-utils';
import { getReceivedGifts } from '@/lib/gifts';

// GET: الهدايا المستلمة
export async function GET(request: NextRequest) {
  try {
    const authResult = await withAuth(request);
    if (!authResult.authenticated) {
      return authResult.error;
    }

    const { page, limit } = getPaginationParams(request);
    const result = await getReceivedGifts(authResult.user!.id, page, limit);

    return apiResponse(result);
  } catch (error) {
    console.error('Get received gifts error:', error);
    return apiError('حدث خطأ أثناء جلب الهدايا', 500);
  }
}
