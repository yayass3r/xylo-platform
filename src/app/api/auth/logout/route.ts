import { NextRequest } from 'next/server';
import { logoutUser } from '@/lib/auth';
import { withAuth, apiResponse, apiError, extractToken } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    const authResult = await withAuth(request);
    if (!authResult.authenticated) {
      return authResult.error;
    }

    const token = extractToken(request);
    if (token) {
      await logoutUser(token);
    }

    return apiResponse(null, 'تم تسجيل الخروج بنجاح');
  } catch (error) {
    console.error('Logout error:', error);
    return apiError('حدث خطأ أثناء تسجيل الخروج', 500);
  }
}
