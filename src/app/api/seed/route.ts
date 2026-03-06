import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

/**
 * API لإنشاء البيانات الأولية
 * يجب استدعاؤه مرة واحدة فقط بعد النشر
 */
export async function POST(request: NextRequest) {
  try {
    // التحقق من وجود مسؤول
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (existingAdmin) {
      return NextResponse.json({
        success: false,
        message: 'البيانات الأولية موجودة بالفعل',
      });
    }

    // إنشاء المسؤول الافتراضي
    const hashedPassword = await hashPassword('Admin123!');
    const admin = await prisma.user.create({
      data: {
        email: 'admin@xylo.com',
        password: hashedPassword,
        name: 'مدير النظام',
        username: 'admin',
        role: 'ADMIN',
        status: 'ACTIVE',
        isEmailVerified: true,
        termsAcceptedAt: new Date(),
        privacyAcceptedAt: new Date(),
      },
    });

    // إنشاء محفظة للمسؤول
    await prisma.wallet.create({
      data: {
        userId: admin.id,
        coinsBalance: 10000,
        diamondsBalance: 0,
      },
    });

    // إنشاء الهدايا الافتراضية
    await prisma.gift.createMany({
      data: [
        { id: 'gift-1', name: 'Heart', nameAr: 'قلب', icon: '❤️', coinCost: 10, diamondValue: 7, isActive: true, sortOrder: 1 },
        { id: 'gift-2', name: 'Star', nameAr: 'نجمة', icon: '⭐', coinCost: 50, diamondValue: 35, isActive: true, sortOrder: 2 },
        { id: 'gift-3', name: 'Crown', nameAr: 'تاج', icon: '👑', coinCost: 100, diamondValue: 70, isActive: true, sortOrder: 3 },
        { id: 'gift-4', name: 'Rocket', nameAr: 'صاروخ', icon: '🚀', coinCost: 200, diamondValue: 140, isActive: true, sortOrder: 4 },
        { id: 'gift-5', name: 'Sparkles', nameAr: 'بريق', icon: '✨', coinCost: 500, diamondValue: 350, isActive: true, sortOrder: 5 },
        { id: 'gift-6', name: 'Party', nameAr: 'احتفال', icon: '🎉', coinCost: 1000, diamondValue: 700, isActive: true, sortOrder: 6 },
      ],
      skipDuplicates: true,
    });

    // إنشاء باقات العملات
    await prisma.coinPackage.createMany({
      data: [
        { id: 'pkg-1', name: 'Starter', nameAr: 'البداية', coins: 100, price: 0.99, currency: 'USD', bonus: 0, isActive: true, sortOrder: 1 },
        { id: 'pkg-2', name: 'Basic', nameAr: 'الأساسية', coins: 500, price: 4.99, currency: 'USD', bonus: 50, isActive: true, sortOrder: 2 },
        { id: 'pkg-3', name: 'Plus', nameAr: 'بلس', coins: 1000, price: 9.99, currency: 'USD', bonus: 150, isActive: true, sortOrder: 3 },
        { id: 'pkg-4', name: 'Premium', nameAr: 'المميزة', coins: 2500, price: 19.99, currency: 'USD', bonus: 500, isActive: true, sortOrder: 4 },
        { id: 'pkg-5', name: 'Pro', nameAr: 'الاحترافية', coins: 5000, price: 39.99, currency: 'USD', bonus: 1500, isActive: true, sortOrder: 5 },
      ],
      skipDuplicates: true,
    });

    // إنشاء إعدادات النظام
    await prisma.systemSetting.createMany({
      data: [
        { id: 'set-1', key: 'platform_commission', value: '0.30', description: 'عمولة المنصة من الهدايا (30%)' },
        { id: 'set-2', key: 'min_withdrawal_amount', value: '1000', description: 'الحد الأدنى للسحب بالألماس' },
        { id: 'set-3', key: 'diamond_to_usd_rate', value: '0.01', description: 'سعر الألماس بالدولار (100 ألماس = 1 دولار)' },
        { id: 'set-4', key: 'require_article_approval', value: 'false', description: 'هل تتطلب المقالات موافقة الإدارة' },
        { id: 'set-5', key: 'app_name', value: 'زايلو', description: 'اسم التطبيق' },
        { id: 'set-6', key: 'support_email', value: 'support@xylo.com', description: 'بريد الدعم' },
      ],
      skipDuplicates: true,
    });

    // إنشاء مستخدم تجريبى (كاتب)
    const writerPassword = await hashPassword('Writer123!');
    const writer = await prisma.user.create({
      data: {
        email: 'writer@xylo.com',
        password: writerPassword,
        name: 'أحمد الكاتب',
        username: 'ahmed_writer',
        role: 'WRITER',
        status: 'ACTIVE',
        isEmailVerified: true,
        termsAcceptedAt: new Date(),
        privacyAcceptedAt: new Date(),
      },
    });

    await prisma.wallet.create({
      data: {
        userId: writer.id,
        coinsBalance: 0,
        diamondsBalance: 5000,
      },
    });

    // إنشاء مستخدم تجريبي (قارئ)
    const readerPassword = await hashPassword('Reader123!');
    const reader = await prisma.user.create({
      data: {
        email: 'reader@xylo.com',
        password: readerPassword,
        name: 'محمد القارئ',
        username: 'mohamed_reader',
        role: 'USER',
        status: 'ACTIVE',
        isEmailVerified: true,
        termsAcceptedAt: new Date(),
        privacyAcceptedAt: new Date(),
      },
    });

    await prisma.wallet.create({
      data: {
        userId: reader.id,
        coinsBalance: 500,
        diamondsBalance: 0,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'تم إنشاء البيانات الأولية بنجاح',
      data: {
        admin: { email: 'admin@xylo.com', password: 'Admin123!' },
        writer: { email: 'writer@xylo.com', password: 'Writer123!' },
        reader: { email: 'reader@xylo.com', password: 'Reader123!' },
      },
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({
      success: false,
      message: 'حدث خطأ أثناء إنشاء البيانات الأولية',
    }, { status: 500 });
  }
}
