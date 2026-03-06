import { NextRequest } from 'next/server';
import { loginUser } from '@/lib/auth';
import { apiResponse, apiError, validateEmail } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // التحقق من البيانات المطلوبة
    if (!email || !password) {
      return apiError('البريد الإلكتروني وكلمة المرور مطلوبان');
    }

    // التحقق من صحة البريد الإلكتروني
    if (!validateEmail(email)) {
      return apiError('البريد الإلكتروني غير صالح');
    }

    // تسجيل الدخول
    const result = await loginUser(email, password);

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
    console.error('Login error:', error);
    return apiError('حدث خطأ أثناء تسجيل الدخول', 500);
  }
}
