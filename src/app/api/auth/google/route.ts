import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateAccessToken, generateRefreshToken } from '@/lib/auth';

/**
 * GET /api/auth/google
 * بدء عملية Google OAuth
 */
export async function GET(request: NextRequest) {
  // Google OAuth Configuration - قراءة من environment variables
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'https://xylo-platform.vercel.app/api/auth/google/callback';

  // التحقق من وجود المتغيرات المطلوبة
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.error('Missing Google OAuth credentials');
    return NextResponse.redirect(
      new URL('/auth/login?error=google_oauth_not_configured', request.url)
    );
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'login';

  // إنشاء state للتحقق
  const state = Buffer.from(JSON.stringify({
    action,
    timestamp: Date.now(),
  })).toString('base64');

  // إنشاء URL للمصادقة
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', GOOGLE_REDIRECT_URI);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'email profile');
  authUrl.searchParams.set('state', state);

  return NextResponse.redirect(authUrl.toString());
}

/**
 * معالجة callback من Google
 */
export async function handleGoogleCallback(code: string) {
  // قراءة environment variables
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'https://xylo-platform.vercel.app/api/auth/google/callback';

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return {
      success: false,
      message: 'Google OAuth غير مُعد بشكل صحيح',
    };
  }

  try {
    // تبديل الكود بالتوكن
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json();
    const { access_token, id_token } = tokenData;

    // الحصول على معلومات المستخدم
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      throw new Error('Failed to get user info');
    }

    const userInfo = await userInfoResponse.json();
    const { email, name, picture, sub: googleId } = userInfo;

    // البحث عن حساب OAuth موجود
    let oAuthAccount = await prisma.oAuthAccount.findUnique({
      where: {
        provider_providerId: {
          provider: 'google',
          providerId: googleId,
        },
      },
      include: { user: true },
    });

    let user;

    if (oAuthAccount) {
      // تحديث معلومات الحساب
      user = oAuthAccount.user;
      
      await prisma.oAuthAccount.update({
        where: { id: oAuthAccount.id },
        data: {
          accessToken: access_token,
          refreshToken: tokenData.refresh_token,
          tokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
          profileData: userInfo,
        },
      });
    } else {
      // البحث عن مستخدم بنفس البريد الإلكتروني
      user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (user) {
        // ربط الحساب بالمستخدم الموجود
        await prisma.oAuthAccount.create({
          data: {
            userId: user.id,
            provider: 'google',
            providerId: googleId,
            accessToken: access_token,
            refreshToken: tokenData.refresh_token,
            tokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
            profileData: userInfo,
          },
        });
      } else {
        // إنشاء مستخدم جديد
        const username = email.split('@')[0] + '_' + Math.random().toString(36).substring(2, 8);

        user = await prisma.user.create({
          data: {
            email: email.toLowerCase(),
            name: name,
            username: username,
            avatar: picture,
            password: Math.random().toString(36), // كلمة مرور عشوائية
            isEmailVerified: true,
          },
        });

        // إنشاء محفظة للمستخدم
        await prisma.wallet.create({
          data: {
            userId: user.id,
          },
        });

        // إنشاء حساب OAuth
        await prisma.oAuthAccount.create({
          data: {
            userId: user.id,
            provider: 'google',
            providerId: googleId,
            accessToken: access_token,
            refreshToken: tokenData.refresh_token,
            tokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
            profileData: userInfo,
          },
        });
      }
    }

    // إنشاء JWT tokens
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
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        avatar: user.avatar,
        role: user.role,
      },
      token,
      refreshToken,
    };
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return {
      success: false,
      message: 'حدث خطأ أثناء تسجيل الدخول',
    };
  }
}
