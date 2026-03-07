import { NextRequest, NextResponse } from 'next/server';
import { handleGoogleCallback } from '../route';

/**
 * GET /api/auth/google/callback
 * معالجة callback من Google OAuth
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // التحقق من وجود خطأ
    if (error) {
      return NextResponse.redirect(
        new URL(`/auth/login?error=${encodeURIComponent('تم رفض الوصول')}`, request.url)
      );
    }

    // التحقق من وجود الكود
    if (!code) {
      return NextResponse.redirect(
        new URL('/auth/login?error=no_code', request.url)
      );
    }

    // معالجة المصادقة
    const result = await handleGoogleCallback(code);

    if (!result.success) {
      return NextResponse.redirect(
        new URL(`/auth/login?error=${encodeURIComponent(result.message || 'حدث خطأ')}`, request.url)
      );
    }

    // إنشاء استجابة مع إعادة التوجيه
    const response = NextResponse.redirect(new URL('/', request.url));

    // تعيين الكوكيز
    response.cookies.set('token', result.token!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 أيام
      path: '/',
    });

    response.cookies.set('refreshToken', result.refreshToken!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 يوم
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/auth/login?error=server_error', request.url)
    );
  }
}
