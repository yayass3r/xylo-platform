import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

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

async function main() {
  console.log('🌱 Starting seed...');

  // إنشاء حساب المسؤول
  const adminEmail = process.env.ADMIN_EMAIL || '409yas@gmail.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@1412Yasser';

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log('✅ Admin already exists, updating role...');
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: {
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
      },
    });
  } else {
    console.log('🔧 Creating admin account...');
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: 'مدير النظام',
        username: 'admin',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        referralCode: generateReferralCode(),
      },
    });

    // إنشاء محفظة للمسؤول
    await prisma.wallet.create({
      data: {
        userId: admin.id,
        coinsBalance: 1000000, // 1 million coins for testing
        diamondsBalance: 0,
      },
    });

    console.log('✅ Admin created successfully:', admin.email);
  }

  // إنشاء باقات العملات الافتراضية
  const existingPackages = await prisma.coinPackage.count();

  if (existingPackages === 0) {
    console.log('🔧 Creating coin packages...');

    await prisma.coinPackage.createMany({
      data: [
        {
          name: 'باقة المبتدئين',
          nameAr: 'باقة المبتدئين',
          nameEn: 'Starter Pack',
          coins: 1000,
          price: 1,
          currency: 'USD',
          bonus: 0,
          isActive: true,
          sortOrder: 1,
        },
        {
          name: 'باقة النجوم',
          nameAr: 'باقة النجوم',
          nameEn: 'Star Pack',
          coins: 5000,
          price: 5,
          currency: 'USD',
          bonus: 250,
          isActive: true,
          sortOrder: 2,
        },
        {
          name: 'باقة المحترفين',
          nameAr: 'باقة المحترفين',
          nameEn: 'Pro Pack',
          coins: 10000,
          price: 10,
          currency: 'USD',
          bonus: 1000,
          isActive: true,
          sortOrder: 3,
        },
        {
          name: 'باقة النخبة',
          nameAr: 'باقة النخبة',
          nameEn: 'Elite Pack',
          coins: 25000,
          price: 25,
          currency: 'USD',
          bonus: 5000,
          isActive: true,
          sortOrder: 4,
        },
        {
          name: 'باقة الأساطير',
          nameAr: 'باقة الأساطير',
          nameEn: 'Legend Pack',
          coins: 50000,
          price: 50,
          currency: 'USD',
          bonus: 15000,
          isActive: true,
          sortOrder: 5,
        },
      ],
    });

    console.log('✅ Coin packages created');
  }

  // إنشاء الهدايا الافتراضية
  const existingGifts = await prisma.gift.count();

  if (existingGifts === 0) {
    console.log('🔧 Creating default gifts...');

    await prisma.gift.createMany({
      data: [
        {
          name: 'Like',
          nameAr: 'إعجاب',
          icon: '👍',
          coinCost: 10,
          diamondValue: 10,
          isActive: true,
          sortOrder: 1,
        },
        {
          name: 'Heart',
          nameAr: 'قلب',
          icon: '❤️',
          coinCost: 50,
          diamondValue: 50,
          isActive: true,
          sortOrder: 2,
        },
        {
          name: 'Star',
          nameAr: 'نجمة',
          icon: '⭐',
          coinCost: 100,
          diamondValue: 100,
          isActive: true,
          sortOrder: 3,
        },
        {
          name: 'Rose',
          nameAr: 'وردة',
          icon: '🌹',
          coinCost: 200,
          diamondValue: 200,
          isActive: true,
          sortOrder: 4,
        },
        {
          name: 'Trophy',
          nameAr: 'كأس',
          icon: '🏆',
          coinCost: 500,
          diamondValue: 500,
          isActive: true,
          sortOrder: 5,
        },
        {
          name: 'Crown',
          nameAr: 'تاج',
          icon: '👑',
          coinCost: 1000,
          diamondValue: 1000,
          isActive: true,
          sortOrder: 6,
        },
        {
          name: 'Diamond',
          nameAr: 'ماسة',
          icon: '💎',
          coinCost: 2000,
          diamondValue: 2000,
          isActive: true,
          sortOrder: 7,
        },
        {
          name: 'Rocket',
          nameAr: 'صاروخ',
          icon: '🚀',
          coinCost: 5000,
          diamondValue: 5000,
          isActive: true,
          sortOrder: 8,
        },
      ],
    });

    console.log('✅ Default gifts created');
  }

  // إنشاء إعدادات النظام الافتراضية
  const existingSettings = await prisma.systemSetting.count();

  if (existingSettings === 0) {
    console.log('🔧 Creating system settings...');

    await prisma.systemSetting.createMany({
      data: [
        {
          key: 'platform_commission_rate',
          value: '0.10',
          description: 'نسبة عمولة المنصة من السحب (10%)',
        },
        {
          key: 'min_withdrawal_diamonds',
          value: '10000',
          description: 'الحد الأدنى للسحب بالألماس',
        },
        {
          key: 'referral_signup_bonus',
          value: '100',
          description: 'مكافأة التسجيل عبر الإحالة',
        },
        {
          key: 'referral_purchase_rate',
          value: '50',
          description: 'عدد العملات لكل دولار ينفقه المُحال',
        },
        {
          key: 'coins_per_dollar',
          value: '1000',
          description: 'عدد العملات مقابل الدولار',
        },
        {
          key: 'diamonds_per_dollar',
          value: '1000',
          description: 'عدد الألماس مقابل الدولار للسحب',
        },
      ],
    });

    console.log('✅ System settings created');
  }

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
