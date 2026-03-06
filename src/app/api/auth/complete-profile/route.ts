import { NextRequest } from 'next/server';
import { apiResponse, apiError, validateUsername } from '@/lib/api-utils';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';

/**
 * توليد كود إحالة عشوائي
 */
function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'XYLO_';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return apiError('يرجى تسجيل الدخول أولاً', 401);
    }

    const body = await request.json();
    const { name, username, acceptTerms, acceptPrivacy } = body;

    // التحقق من اسم المستخدم
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

    // التحقق من عدم وجود المستخدم
    let dbUser = await prisma.user.findUnique({
      where: { email: supabaseUser.email! },
    });

    if (dbUser) {
      // تحديث المستخدم الموجود
      dbUser = await prisma.user.update({
        where: { id: dbUser.id },
        data: {
          name: name || dbUser.name,
          username: username || dbUser.username,
          termsAcceptedAt: acceptTerms ? new Date() : dbUser.termsAcceptedAt,
          privacyAcceptedAt: acceptPrivacy ? new Date() : dbUser.privacyAcceptedAt,
        },
      });
    } else {
      // إنشاء مستخدم جديد
      // التحقق من عدم وجود اسم المستخدم
      if (username) {
        const existingUsername = await prisma.user.findUnique({
          where: { username },
        });

        if (existingUsername) {
          return apiError('اسم المستخدم مستخدم بالفعل');
        }
      }

      dbUser = await prisma.user.create({
        data: {
          email: supabaseUser.email!,
          password: '', // OAuth users don't have passwords
          name: name || supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || null,
          username: username || supabaseUser.email!.split('@')[0] + '_' + supabaseUser.id.slice(0, 6),
          avatar: supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.picture || null,
          isEmailVerified: supabaseUser.email_confirmed_at ? true : false,
          termsAcceptedAt: acceptTerms ? new Date() : null,
          privacyAcceptedAt: acceptPrivacy ? new Date() : null,
          referralCode: generateReferralCode(),
        },
      });

      // إنشاء محفظة للمستخدم
      await prisma.wallet.create({
        data: {
          userId: dbUser.id,
          coinsBalance: 0,
          diamondsBalance: 0,
        },
      });
    }

    return apiResponse({
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        username: dbUser.username,
        avatar: dbUser.avatar,
        role: dbUser.role,
        status: dbUser.status,
        isKycVerified: dbUser.isKycVerified,
      },
    });
  } catch (error) {
    console.error('Complete profile error:', error);
    return apiError('حدث خطأ أثناء إكمال الملف الشخصي', 500);
  }
}
