import { NextRequest } from 'next/server';
import { refreshAccessToken } from '@/lib/auth';
import { apiResponse, apiError } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return apiError('Refresh Token مطلوب');
    }

    const result = await refreshAccessToken(refreshToken);

    if (!result.success) {
      return apiError(result.message);
    }

    return apiResponse(
      {
        user: result.user,
        token: result.token,
        refreshToken: result.refreshToken,
      },
      result.message
    );
  } catch (error) {
    console.error('Refresh token error:', error);
    return apiError('حدث خطأ أثناء تجديد الجلسة', 500);
  }
}
