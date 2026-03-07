import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from './auth';

/**
 * استخراج Token من الطلب
 */
export function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // محاولة الحصول من الكوكيز
  const tokenFromCookie = request.cookies.get('token')?.value;
  if (tokenFromCookie) {
    return tokenFromCookie;
  }

  return null;
}

/**
 * التحقق من المصادقة (JWT فقط)
 */
export async function withAuth(request: NextRequest) {
  const token = extractToken(request);
  if (!token) {
    return {
      authenticated: false,
      error: NextResponse.json(
        { success: false, message: 'يرجى تسجيل الدخول' },
        { status: 401 },
      ),
      user: null,
    };
  }

  const user = await getUserFromToken(token);
  if (!user) {
    return {
      authenticated: false,
      error: NextResponse.json(
        { success: false, message: 'الجلسة منتهية الصلاحية' },
        { status: 401 },
      ),
      user: null,
    };
  }

  return {
    authenticated: true,
    error: null,
    user,
  };
}

/**
 * التحقق من صلاحيات المسؤول
 */
export async function withAdminAuth(request: NextRequest) {
  const authResult = await withAuth(request);
  if (!authResult.authenticated) {
    return authResult;
  }

  if (authResult.user!.role !== 'ADMIN') {
    return {
      authenticated: false,
      error: NextResponse.json(
        { success: false, message: 'غير مصرح لك بالوصول' },
        { status: 403 },
      ),
      user: null,
    };
  }

  return authResult;
}

/**
 * التحقق من صلاحيات الكاتب
 */
export async function withWriterAuth(request: NextRequest) {
  const authResult = await withAuth(request);
  if (!authResult.authenticated) {
    return authResult;
  }

  const userRole = authResult.user!.role;
  if (userRole !== 'WRITER' && userRole !== 'ADMIN') {
    return {
      authenticated: false,
      error: NextResponse.json(
        { success: false, message: 'هذه الميزة للكتاب فقط' },
        { status: 403 },
      ),
      user: null,
    };
  }

  return authResult;
}

/**
 * التحقق من حالة المستخدم
 */
export async function withActiveUser(request: NextRequest) {
  const authResult = await withAuth(request);
  if (!authResult.authenticated) {
    return authResult;
  }

  const userStatus = authResult.user!.status;
  if (userStatus === 'BANNED') {
    return {
      authenticated: false,
      error: NextResponse.json(
        { success: false, message: 'تم حظر حسابك' },
        { status: 403 },
      ),
      user: null,
    };
  }

  if (userStatus === 'SUSPENDED') {
    return {
      authenticated: false,
      error: NextResponse.json(
        { success: false, message: 'تم تعليق حسابك مؤقتاً' },
        { status: 403 },
      ),
      user: null,
    };
  }

  return authResult;
}

/**
 * استجابة API موحدة
 */
export function apiResponse<T>(data: T, message?: string, status: number = 200) {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
    },
    { status },
  );
}

/**
 * استجابة خطأ موحدة
 */
export function apiError(message: string, status: number = 400) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    { status },
  );
}

/**
 * استخراج معاملات الصفحة
 */
export function getPaginationParams(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

/**
 * التحقق من صحة البيانات
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'كلمة المرور يجب أن تحتوي على رقم واحد على الأقل' };
  }
  return { valid: true };
}

export function validateUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
}
