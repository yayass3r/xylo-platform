import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { hashPassword, generateToken, setAuthCookie, generateReferralCode } from '@/lib/auth';
import { REFERRAL_REWARDS } from '@/lib/constants';

const registerSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل').optional(),
  referralCode: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, referralCode } = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني مستخدم بالفعل' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Generate unique referral code
    let userReferralCode = generateReferralCode();
    let codeExists = await db.user.findUnique({ where: { referralCode: userReferralCode } });
    while (codeExists) {
      userReferralCode = generateReferralCode();
      codeExists = await db.user.findUnique({ where: { referralCode: userReferralCode } });
    }

    // Create user
    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        displayName: name,
        referralCode: userReferralCode,
        referredBy: referralCode || null,
        role: 'USER',
      },
    });

    // Create wallet
    await db.wallet.create({
      data: {
        userId: user.id,
        malcoinBalance: 0,
        quscoinBalance: 0,
      },
    });

    // Handle referral bonus
    if (referralCode) {
      const referrer = await db.user.findUnique({
        where: { referralCode },
      });

      if (referrer) {
        // Create referral record
        await db.referral.create({
          data: {
            referrerId: referrer.id,
            referredId: user.id,
            bonusPaid: true,
            bonusAmount: REFERRAL_REWARDS.SIGNUP_BONUS_MALCOIN,
          },
        });

        // Give bonus to new user
        await db.wallet.update({
          where: { userId: user.id },
          data: {
            malcoinBalance: { increment: REFERRAL_REWARDS.SIGNUP_BONUS_MALCOIN },
          },
        });

        // Record transaction
        await db.transaction.create({
          data: {
            userId: user.id,
            type: 'REFERRAL_BONUS',
            amount: REFERRAL_REWARDS.SIGNUP_BONUS_MALCOIN,
            currency: 'MALCOIN',
            description: `مكافأة التسجيل عبر إحالة ${referrer.name || referrer.email}`,
          },
        });

        // Notify referrer
        await db.notification.create({
          data: {
            userId: referrer.id,
            type: 'REFERRAL_BONUS',
            title: 'إحالة جديدة! 🎉',
            message: `${user.name || user.email} سجل باستخدام رمز الإحالة الخاص بك`,
          },
        });
      }
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Set cookie
    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        displayName: user.displayName,
        role: user.role,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation error" },
        { status: 400 }
      );
    }
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء التسجيل' },
      { status: 500 }
    );
  }
}
