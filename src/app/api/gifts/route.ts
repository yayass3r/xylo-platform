import { NextRequest } from 'next/server';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getAvailableGifts } from '@/lib/gifts';

// GET: قائمة الهدايا المتاحة
export async function GET() {
  try {
    const gifts = await getAvailableGifts();
    return apiResponse({ gifts });
  } catch (error) {
    console.error('Get gifts error:', error);
    return apiError('حدث خطأ أثناء جلب الهدايا', 500);
  }
}
