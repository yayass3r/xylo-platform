import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 بدء زرع البيانات الأولية...');

  // إنشاء الهدايا الافتراضية
  const gifts = [
    { name: 'Coffee', nameAr: 'قهوة', icon: '☕', cost: 100, sortOrder: 1 },
    { name: 'Rose', nameAr: 'وردة', icon: '🌹', cost: 250, sortOrder: 2 },
    { name: 'Heart', nameAr: 'قلب', icon: '❤️', cost: 500, sortOrder: 3 },
    { name: 'Star', nameAr: 'نجمة', icon: '⭐', cost: 1000, sortOrder: 4 },
    { name: 'Crown', nameAr: 'تاج', icon: '👑', cost: 2500, sortOrder: 5 },
    { name: 'Rocket', nameAr: 'صاروخ', icon: '🚀', cost: 5000, sortOrder: 6 },
    { name: 'Diamond', nameAr: 'ماسة', icon: '💎', cost: 10000, sortOrder: 7 },
    { name: 'Unicorn', nameAr: 'حصان وحيد القرن', icon: '🦄', cost: 25000, sortOrder: 8 },
  ];

  console.log('📦 إضافة الهدايا...');
  for (const gift of gifts) {
    await prisma.gift.upsert({
      where: { name: gift.name },
      update: gift,
      create: gift,
    });
  }
  console.log('✅ تم إضافة الهدايا');

  // إنشاء باقات الشحن
  const packages = [
    { name: 'Basic', description: 'أساسي - 500 MALCOIN', malcoinAmount: 500, priceUSD: 1, bonusMalcoin: 0, sortOrder: 1 },
    { name: 'Starter', description: 'مبتدئ - 2500 MALCOIN + 125 مكافأة', malcoinAmount: 2500, priceUSD: 5, bonusMalcoin: 125, sortOrder: 2 },
    { name: 'Popular', description: 'شائع - 5000 MALCOIN + 500 مكافأة', malcoinAmount: 5000, priceUSD: 10, bonusMalcoin: 500, sortOrder: 3 },
    { name: 'Premium', description: 'مميز - 12500 MALCOIN + 2500 مكافأة', malcoinAmount: 12500, priceUSD: 25, bonusMalcoin: 2500, sortOrder: 4 },
    { name: 'Professional', description: 'احترافي - 25000 MALCOIN + 7500 مكافأة', malcoinAmount: 25000, priceUSD: 50, bonusMalcoin: 7500, sortOrder: 5 },
    { name: 'Enterprise', description: 'مؤسسي - 50000 MALCOIN + 20000 مكافأة', malcoinAmount: 50000, priceUSD: 100, bonusMalcoin: 20000, sortOrder: 6 },
  ];

  console.log('💳 إضافة باقات الشحن...');
  for (const pkg of packages) {
    await prisma.rechargePackage.upsert({
      where: { name: pkg.name },
      update: pkg,
      create: pkg,
    });
  }
  console.log('✅ تم إضافة باقات الشحن');

  // إنشاء مستخدم مسؤول افتراضي
  console.log('👤 إنشاء مستخدم مسؤول...');
  const adminExists = await prisma.user.findUnique({
    where: { email: 'admin@xylo.com' },
  });

  if (!adminExists) {
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123456', 12);

    await prisma.user.create({
      data: {
        email: 'admin@xylo.com',
        password: hashedPassword,
        name: 'مدير النظام',
        displayName: 'مدير النظام',
        role: 'ADMIN',
        isVerified: true,
        verifiedAt: new Date(),
        referralCode: 'ADMIN001',
        wallet: {
          create: {
            malcoinBalance: 1000000,
            quscoinBalance: 500000,
          },
        },
      },
    });
    console.log('✅ تم إنشاء مستخدم المسؤول');
  }

  // إنشاء مقالات تجريبية
  console.log('📝 إنشاء مقالات تجريبية...');
  const articles = [
    {
      title: 'مرحباً بكم في زايلو - منصة صُنّاع المحتوى العربي',
      slug: 'welcome-to-xylo-' + Date.now(),
      content: `<h2>مرحباً بكم! 🎉</h2>
<p>نحن سعداء بانضمامكم إلى منصة <strong>زايلو</strong>، المنصة العربية الأولى التي تربط الكُتّاب بقرّائهم وتتيح للقرّاء دعم الكُتّاب المفضلين لديهم.</p>
<h3>ما هي زايلو؟</h3>
<p>زايلو هي منصة متكاملة لصُنّاع المحتوى العربي، حيث يمكنك:</p>
<ul>
<li>📝 نشر مقالاتك ومحتواك</li>
<li>🎁 تلقي الهدايا والدعم من قرّائك</li>
<li>💰 تحويل الهدايا إلى أرباح حقيقية</li>
<li>📊 متابعة أداء محتواك</li>
</ul>
<h3>نظام العملات</h3>
<p>نستخدم نظام عملات مزدوج:</p>
<ul>
<li><strong>MALCOIN</strong>: عملة الشحن - يشتريها القراء لإرسال الهدايا</li>
<li><strong>QUSCOIN</strong>: عملة الأرباح - يحصل عليها الكتاب من الهدايا</li>
</ul>
<p>ابدأ رحلتك معنا اليوم! 🚀</p>`,
      excerpt: 'مرحباً بكم في منصة زايلو، المنصة العربية الأولى لصُنّاع المحتوى.',
      category: 'other',
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
    {
      title: '10 نصائح لكتابة محتوى جذاب',
      slug: '10-tips-engaging-content-' + Date.now(),
      content: `<h2>كيف تكتب محتوى يجذب القرّاء؟</h2>
<p>كتابة المحتوى الجذاب هي مهارة يمكن تطويرها بالممارسة. إليك أهم النصائح:</p>
<h3>1. ابدأ بعنوان قوي</h3>
<p>العنوان هو أول ما يراه القارئ. اجعله جذاباً وواضحاً.</p>
<h3>2. استخدم الفقرات القصيرة</h3>
<p>الفقرات القصيرة أسهل في القراءة، خاصة على الهواتف المحمولة.</p>
<h3>3. أضف قيمة حقيقية</h3>
<p>كل مقال يجب أن يقدم فائدة للقارئ - معلومة، نصيحة، أو ترفيه.</p>
<h3>4. استخدم الصور والوسائط</h3>
<p>الصور تكسر النص وتجعله أكثر جاذبية.</p>
<h3>5. تفاعل مع قرّائك</h3>
<p>الرد على التعليقات يبني مجتمعاً حول محتواك.</p>
<p>ابدأ بتطبيق هذه النصائح وستلاحظ الفرق! ✨</p>`,
      excerpt: 'تعلم كيف تكتب محتوى يجذب القرّاء ويزيد من تفاعلهم.',
      category: 'education',
      status: 'PUBLISHED',
      publishedAt: new Date(Date.now() - 86400000),
    },
  ];

  // الحصول على معرف المستخدم المسؤول
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@xylo.com' },
  });

  if (admin) {
    for (const article of articles) {
      await prisma.article.create({
        data: {
          ...article,
          authorId: admin.id,
        },
      });
    }
    console.log('✅ تم إنشاء المقالات التجريبية');
  }

  console.log('🎉 تم زرع البيانات بنجاح!');
}

main()
  .catch((e) => {
    console.error('❌ خطأ في زرع البيانات:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
