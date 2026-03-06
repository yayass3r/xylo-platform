import { NextRequest } from 'next/server';
import { registerUser } from '@/lib/auth';
import { apiResponse, apiError, validateEmail, validatePassword, validateUsername } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, username, acceptTerms, acceptPrivacy } = body;

    // التحقق من البيانات المطلوبة
    if (!email || !password) {
      return apiError('البريد الإلكتروني وكلمة المرور مطلوبان');
    }

    // التحقق من صحة البريد الإلكتروني
    if (!validateEmail(email)) {
      return apiError('البريد الإلكتروني غير صالح');
    }

    // التحقق من قوة كلمة المرور
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return apiError(passwordValidation.message || 'كلمة المرور غير صالحة');
    }

    // التحقق من اسم المستخدم إن وجد
    if (username && !validateUsername(username)) {
      return apiError('اسم المستخدم يجب أن يكون 3-20 حرف (أحرف إنجليزية، أرقام، _ فقط)');
    }

    // التحقق من الموافقة على الشروط
    if (!acceptTerms) {
      return apiError('يجب الموافقة على الشروط والأحكام');
    }

    if (!acceptPrivacy) {
      return apiError('يجب الموافقة على سياسة الخصوصية');
    }

    // تسجيل المستخدم
    const result = await registerUser({
      email,
      password,
      name,
      username,
      acceptTerms,
      acceptPrivacy,
    });

    if (!result.success) {
      return apiError(result.message);
    }

    return apiResponse(
      {
        user: result.user,
        token: result.token,
        refreshToken: result.refreshToken,
      },
      result.message,
      201
    );
  } catch (error) {
    console.error('Registration error:', error);
    return apiError('حدث خطأ أثناء إنشاء الحساب', 500);
  }
}
