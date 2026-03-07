import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { prisma } from './db';

/**
 * Get JWT secret key as Uint8Array for jose library
 */
function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not defined');
  }
  return new TextEncoder().encode(secret);
}

// Token expiration times
const ACCESS_TOKEN_EXPIRES_IN = '7d'; // 7 days
const REFRESH_TOKEN_EXPIRES_IN = '30d'; // 30 days

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
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
    coinsBalance?: number;
  };
  token?: string;
  refreshToken?: string;
}

/**
 * Hash password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Alias for verifyPassword
 */
export const comparePassword = verifyPassword;

/**
 * Generate Access Token using jose (Edge Runtime compatible)
 */
export async function generateAccessToken(payload: JWTPayload): Promise<string> {
  const secretKey = getSecretKey();
  
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRES_IN)
    .sign(secretKey);
}

/**
 * Generate Refresh Token using jose (Edge Runtime compatible)
 */
export async function generateRefreshToken(payload: JWTPayload): Promise<string> {
  const secretKey = getSecretKey();
  
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRES_IN)
    .sign(secretKey);
}

/**
 * Verify JWT token using jose (Edge Runtime compatible)
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const secretKey = getSecretKey();
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ['HS256'],
    });
    return payload as JWTPayload;
  } catch (error) {
    console.error('Token verification failed:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

/**
 * Register new user
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
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existingUser) {
      return {
        success: false,
        message: 'البريد الإلكتروني مستخدم بالفعل',
      };
    }

    // Check username uniqueness
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

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Create user
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

    // Create wallet
    await prisma.wallet.create({
      data: {
        userId: user.id,
        coinsBalance: 0,
        diamondsBalance: 0,
      },
    });

    // Generate tokens
    const token = await generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = await generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Save session
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
 * Login user
 */
export async function loginUser(email: string, password: string): Promise<AuthResult> {
  try {
    // Find user
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

    // Check user status
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

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password);

    if (!isPasswordValid) {
      return {
        success: false,
        message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
      };
    }

    // Generate tokens
    const token = await generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = await generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Save session
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
        coinsBalance: user.wallet?.coinsBalance || 0,
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
 * Logout user
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
 * Get current user from token (server-side)
 */
export async function getCurrentUser() {
  try {
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
 * Get user from token
 */
export async function getUserFromToken(token: string) {
  try {
    const payload = await verifyToken(token);
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
 * Check if user is admin
 */
export function isAdmin(user: { role: string }): boolean {
  return user.role === 'ADMIN';
}

/**
 * Check if user is writer (or admin)
 */
export function isWriter(user: { role: string }): boolean {
  return user.role === 'WRITER' || user.role === 'ADMIN';
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<AuthResult> {
  try {
    const payload = await verifyToken(refreshToken);
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

    // Generate new tokens
    const newToken = await generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const newRefreshToken = await generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Update session
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
