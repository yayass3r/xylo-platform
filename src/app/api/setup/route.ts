import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * API لإعداد قاعدة البيانات
 * يتحقق من حالة الجداول وينشئ الـ Enums
 * يجب استدعاؤه مرة واحدة فقط بعد النشر
 */
export async function POST(request: NextRequest) {
  try {
    // التحقق من وجود الجداول بمحاولة الاستعلام عن المستخدمين
    try {
      const userCount = await prisma.user.count();
      return NextResponse.json({
        success: true,
        message: 'قاعدة البيانات جاهزة بالفعل',
        tablesExist: true,
        userCount,
      });
    } catch {
      // الجداول غير موجودة، نحتاج لإنشائها
    }

    // تنفيذ SQL لإنشاء الـ Enums
    const result = await prisma.$executeRawUnsafe(`
      -- CreateEnum
      DO $$ BEGIN
        CREATE TYPE "UserRole" AS ENUM ('USER', 'WRITER', 'ADMIN');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'BANNED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE "ArticleStatus" AS ENUM ('DRAFT', 'PENDING', 'PUBLISHED', 'REJECTED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE "TransactionType" AS ENUM ('PURCHASE', 'TIP', 'WITHDRAWAL', 'REFUND', 'REFERRAL_BONUS', 'ADMIN_ADJUSTMENT');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE "WithdrawalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PAID');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE "KycStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'REVIEWING', 'RESOLVED', 'DISMISSED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE "IdType" AS ENUM ('NATIONAL_ID', 'PASSPORT', 'DRIVER_LICENSE');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE "PaymentGatewayProvider" AS ENUM ('STRIPE', 'PAYPAL', 'SKRILL', 'STC_PAY', 'MOYASAR', 'APPLE_PAY', 'GOOGLE_PAY');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE "PaymentGatewayStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'SUSPENDED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE "PaymentEnvironment" AS ENUM ('SANDBOX', 'PRODUCTION');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE "MessageStatus" AS ENUM ('SENT', 'DELIVERED', 'READ', 'DELETED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE "ConversationType" AS ENUM ('DIRECT', 'GROUP', 'SUPPORT');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE "ReferralRewardType" AS ENUM ('SIGNUP_BONUS', 'PURCHASE_COMMISSION');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE "ReferralRewardStatus" AS ENUM ('PENDING', 'AWARDED', 'CANCELLED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    return NextResponse.json({
      success: true,
      message: 'تم إنشاء الـ Enums بنجاح. يرجى استخدام Prisma db push من بيئة محلية أو Vercel build',
      result,
    });
  } catch (error: any) {
    console.error('Setup error:', error);
    return NextResponse.json({
      success: false,
      message: 'حدث خطأ أثناء إعداد قاعدة البيانات',
      error: error.message,
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // التحقق من حالة قاعدة البيانات
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;

    return NextResponse.json({
      success: true,
      tables: tables,
      message: 'حالة قاعدة البيانات',
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: 'خطأ في الاتصال بقاعدة البيانات',
      error: error.message,
    }, { status: 500 });
  }
}
