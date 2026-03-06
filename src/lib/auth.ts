import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'xylo-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';
const REFRESH_TOKEN_EXPIRES_IN = '30d';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export interface AuthResult {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    name: string | null;
    username: string | null;
    avatar: string | null;
    role: string;
    status: string;
    isKycVerified: boolean;
  };
  token?: string;
  refreshToken?: string;
}

/**
 * تشفير كلمة المرور
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * التحقق من كلمة المرور
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * مقارنة كلمة المرور (alias for verifyPassword)
 */
export const comparePassword = verifyPassword;

/**
 * إنشاء Access Token
 */
export function generateAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * إنشاء Refresh Token
 */
export function generateRefreshToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
}

/**
 * التحقق من صحة Token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * تسجيل مستخدم جديد
 */
export async function registerUser(data: {
  email: string;
  password: string;
  name?: string;
  username?: string;
  acceptTerms?: boolean;
  acceptPrivacy?: boolean;
}): Promise<AuthResult> {
  try {
    // التحقق من وجود المستخدم
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existingUser) {
      return {
        success: false,
        message: 'البريد الإلكتروني مستخدم بالفعل',
      };
    }

    // التحقق من اسم المستخدم
    if (data.username) {
      const existingUsername = await prisma.user.findUnique({
        where: { username: data.username },
      });

      if (existingUsername) {
        return {
          success: false,
          message: 'اسم المستخدم مستخدم بالفعل',
        };
      }
    }

    // تشفير كلمة المرور
    const hashedPassword = await hashPassword(data.password);

    // إنشاء المستخدم
    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        password: hashedPassword,
        name: data.name || null,
        username: data.username || null,
        termsAcceptedAt: data.acceptTerms ? new Date() : null,
        privacyAcceptedAt: data.acceptPrivacy ? new Date() : null,
      },
    });

    // إنشاء محفظة للمستخدم
    await prisma.wallet.create({
      data: {
        userId: user.id,
        coinsBalance: 0,
        diamondsBalance: 0,
      },
    });

    // إنشاء Tokens
    const token = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // حفظ الجلسة
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        refreshToken,
        expiresAt,
      },
    });

    return {
      success: true,
      message: 'تم إنشاء الحساب بنجاح',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        avatar: user.avatar,
        role: user.role,
        status: user.status,
        isKycVerified: user.isKycVerified,
      },
      token,
      refreshToken,
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      message: 'حدث خطأ أثناء إنشاء الحساب',
    };
  }
}

/**
 * تسجيل الدخول
 */
export async function loginUser(email: string, password: string): Promise<AuthResult> {
  try {
    // البحث عن المستخدم
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { wallet: true },
    });

    if (!user) {
      return {
        success: false,
        message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
      };
    }

    // التحقق من حالة المستخدم
    if (user.status === 'BANNED') {
      return {
        success: false,
        message: 'تم حظر حسابك. يرجى التواصل مع الدعم',
      };
    }

    if (user.status === 'SUSPENDED') {
      return {
        success: false,
        message: 'تم تعليق حسابك مؤقتاً',
      };
    }

    // التحقق من كلمة المرور
    const isPasswordValid = await verifyPassword(password, user.password);

    if (!isPasswordValid) {
      return {
        success: false,
        message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
      };
    }

    // إنشاء Tokens
    const token = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // حفظ الجلسة
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        refreshToken,
        expiresAt,
      },
    });

    return {
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        avatar: user.avatar,
        role: user.role,
        status: user.status,
        isKycVerified: user.isKycVerified,
      },
      token,
      refreshToken,
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      message: 'حدث خطأ أثناء تسجيل الدخول',
    };
  }
}

/**
 * تسجيل الخروج
 */
export async function logoutUser(token: string): Promise<{ success: boolean; message: string }> {
  try {
    await prisma.session.deleteMany({
      where: { token },
    });

    return {
      success: true,
      message: 'تم تسجيل الخروج بنجاح',
    };
  } catch (error) {
    console.error('Logout error:', error);
    return {
      success: false,
      message: 'حدث خطأ أثناء تسجيل الخروج',
    };
  }
}

/**
 * الحصول على المستخدم الحالي (من JWT token)
 */
export async function getCurrentUser() {
  try {
    // This function should be called from server-side code
    // where headers are available
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) return null;
    
    return getUserFromToken(token);
  } catch {
    return null;
  }
}

/**
 * الحصول على المستخدم من Token
 */
export async function getUserFromToken(token: string) {
  try {
    const payload = verifyToken(token);
    if (!payload) return null;

    const session = await prisma.session.findFirst({
      where: {
        token,
        expiresAt: { gt: new Date() },
      },
    });

    if (!session) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { wallet: true, kycVerification: true },
    });

    return user;
  } catch {
    return null;
  }
}

/**
 * التحقق من صلاحيات المسؤول
 */
export function isAdmin(user: { role: string }): boolean {
  return user.role === 'ADMIN';
}

/**
 * التحقق من صلاحيات الكاتب
 */
export function isWriter(user: { role: string }): boolean {
  return user.role === 'WRITER' || user.role === 'ADMIN';
}

/**
 * تجديد Token
 */
export async function refreshAccessToken(refreshToken: string): Promise<AuthResult> {
  try {
    const payload = verifyToken(refreshToken);
    if (!payload) {
      return {
        success: false,
        message: 'Refresh Token غير صالح',
      };
    }

    const session = await prisma.session.findFirst({
      where: {
        refreshToken,
        expiresAt: { gt: new Date() },
      },
    });

    if (!session) {
      return {
        success: false,
        message: 'الجلسة منتهية الصلاحية',
      };
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return {
        success: false,
        message: 'المستخدم غير موجود',
      };
    }

    // إنشاء Tokens جديدة
    const newToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const newRefreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // تحديث الجلسة
    await prisma.session.update({
      where: { id: session.id },
      data: {
        token: newToken,
        refreshToken: newRefreshToken,
      },
    });

    return {
      success: true,
      message: 'تم تجديد الجلسة بنجاح',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        avatar: user.avatar,
        role: user.role,
        status: user.status,
        isKycVerified: user.isKycVerified,
      },
      token: newToken,
      refreshToken: newRefreshToken,
    };
  } catch (error) {
    console.error('Refresh token error:', error);
    return {
      success: false,
      message: 'حدث خطأ أثناء تجديد الجلسة',
    };
  }
}
