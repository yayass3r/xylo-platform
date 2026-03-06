# دليل نشر منصة زايلو (Xylo) على الخدمات المجانية

## 📋 المتطلبات المسبقة

1. حساب GitHub
2. حساب Vercel (للاستضافة الأمامية)
3. حساب Supabase (لقاعدة البيانات)
4. حساب Render أو Railway (للخلفية - اختياري)

---

## 🗄️ إعداد قاعدة البيانات (Supabase)

### الخطوة 1: إنشاء مشروع Supabase
1. اذهب إلى [supabase.com](https://supabase.com)
2. سجل دخول أو أنشئ حساب جديد
3. اضغط "New Project"
4. أدخل اسم المشروع (xylo)
5. اختر كلمة مرور قوية لقاعدة البيانات
6. اختر أقرب منطقة (Europe West أو Middle East)
7. اضغط "Create new project"

### الخطوة 2: الحصول على رابط قاعدة البيانات
1. في لوحة التحكم، اذهب إلى **Settings** > **Database**
2. انسخ **Connection string** (URI)
3. استبدل `[YOUR-PASSWORD]` بكلمة المرور التي اخترتها

### الخطوة 3: إنشاء الجداول
```bash
# في مجلد المشروع
npx prisma db push
```

أو يمكنك تشغيل الـ migrations:
```bash
npx prisma migrate dev --name init
```

---

## 🌐 إعداد الاستضافة (Vercel)

### الخطوة 1: ربط المشروع بـ GitHub
```bash
# إنشاء مستودع جديد
git init
git add .
git commit -m "Initial commit - Xylo Platform"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/xylo.git
git push -u origin main
```

### الخطوة 2: النشر على Vercel
1. اذهب إلى [vercel.com](https://vercel.com)
2. سجل دخول باستخدام GitHub
3. اضغط "New Project"
4. اختر مستودع المشروع
5. أضف متغيرات البيئة:

```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"
```

6. اضغط "Deploy"

---

## 🔧 متغيرات البيئة المطلوبة

أنشئ ملف `.env` في جذر المشروع:

```env
# قاعدة البيانات
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# المصادقة
JWT_SECRET="your-super-secret-jwt-key-at-least-32-characters"

# التطبيق
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"
NEXT_PUBLIC_APP_NAME="زايلو"

# بوابات الدفع (اختياري - للإنتاج)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Redis (اختياري - للكاش)
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."
```

---

## 📦 إعداد البداية (Seed Data)

بعد نشر المشروع، تحتاج لإنشاء البيانات الأولية:

### 1. إنشاء مسؤول افتراضي
```bash
# شغل هذا سكريبت محلياً أو من خلال API
curl -X POST https://your-app.vercel.app/api/admin/seed
```

أو يدوياً في قاعدة البيانات:

```sql
INSERT INTO "User" (id, email, password, name, role, status, "isEmailVerified")
VALUES (
  'admin-001',
  'admin@xylo.com',
  '$2a$12$...', -- bcrypt hash of password
  'مدير النظام',
  'ADMIN',
  'ACTIVE',
  true
);
```

### 2. إضافة الهدايا الافتراضية
```sql
INSERT INTO "Gift" (id, name, "nameAr", icon, "coinCost", "diamondValue", "isActive", "sortOrder")
VALUES
  ('gift-1', 'Heart', 'قلب', '❤️', 10, 7, true, 1),
  ('gift-2', 'Star', 'نجمة', '⭐', 50, 35, true, 2),
  ('gift-3', 'Crown', 'تاج', '👑', 100, 70, true, 3),
  ('gift-4', 'Rocket', 'صاروخ', '🚀', 200, 140, true, 4),
  ('gift-5', 'Sparkles', 'بريق', '✨', 500, 350, true, 5),
  ('gift-6', 'Party', 'احتفال', '🎉', 1000, 700, true, 6);
```

### 3. إضافة باقات العملات
```sql
INSERT INTO "CoinPackage" (id, name, "nameAr", coins, price, currency, bonus, "isActive", "sortOrder")
VALUES
  ('pkg-1', 'Starter', 'البداية', 100, 0.99, 'USD', 0, true, 1),
  ('pkg-2', 'Basic', 'الأساسية', 500, 4.99, 'USD', 50, true, 2),
  ('pkg-3', 'Plus', 'بلس', 1000, 9.99, 'USD', 150, true, 3),
  ('pkg-4', 'Premium', 'المميزة', 2500, 19.99, 'USD', 500, true, 4),
  ('pkg-5', 'Pro', 'الاحترافية', 5000, 39.99, 'USD', 1500, true, 5);
```

### 4. إعدادات النظام
```sql
INSERT INTO "SystemSetting" (id, key, value, description)
VALUES
  ('set-1', 'platform_commission', '0.30', 'عمولة المنصة من الهدايا (30%)'),
  ('set-2', 'min_withdrawal_amount', '1000', 'الحد الأدنى للسحب بالألماس'),
  ('set-3', 'diamond_to_usd_rate', '0.01', 'سعر الألماس بالدولار (100 ألماس = 1 دولار)'),
  ('set-4', 'require_article_approval', 'false', 'هل تتطلب المقالات موافقة الإدارة');
```

---

## 🔐 إعداد الدفع (Stripe - اختياري)

### 1. إنشاء حساب Stripe
1. اذهب إلى [stripe.com](https://stripe.com)
2. أنشئ حساب جديد
3. في لوحة التحكم، احصل على:
   - Secret Key (للخادم)
   - Publishable Key (للواجهة)

### 2. إعداد Webhook
1. في Stripe Dashboard > Developers > Webhooks
2. أضف endpoint: `https://your-app.vercel.app/api/webhooks/stripe`
3. اختر الأحداث: `checkout.session.completed`, `payment_intent.succeeded`
4. انسخ Webhook Secret

### 3. إضافة مفاتيح Stripe في Vercel
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## 📱 إعداد التطبيق المستقبلي (React Native / Flutter)

تم تصميم الـ API ليكون مستقلاً وقابلاً للاستخدام مع تطبيقات الموبايل:

### مثال على الاستخدام مع React Native:
```typescript
// API Client
const API_URL = 'https://your-app.vercel.app/api';

// تسجيل الدخول
const login = async (email: string, password: string) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return response.json();
};

// الحصول على المقالات
const getArticles = async (page: number = 1) => {
  const response = await fetch(`${API_URL}/articles?page=${page}&limit=20`);
  return response.json();
};

// إرسال هدية
const sendGift = async (token: string, giftId: string, receiverId: string) => {
  const response = await fetch(`${API_URL}/gifts/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ giftId, receiverId }),
  });
  return response.json();
};
```

---

## 🚀 أوامر مفيدة

```bash
# تثبيت التبعيات
bun install

# تشغيل التطبيق محلياً
bun run dev

# بناء التطبيق للإنتاج
bun run build

# تشغيل الـ lint
bun run lint

# تحديث قاعدة البيانات
bun run db:push

# إنشاء Prisma Client
bun run db:generate
```

---

## 📊 حدود الخدمات المجانية

| الخدمة | الحد المجاني |
|--------|--------------|
| Vercel | 100GB bandwidth, 100GB storage |
| Supabase | 500MB database, 1GB storage, 5GB bandwidth |
| Render | 750 ساعة/شهر، 512MB RAM |
| Upstash Redis | 10,000 طلب/يوم |

---

## ⚠️ ملاحظات مهمة

1. **الأمان**: غيّر جميع المفاتيح السرية قبل الإنتاج
2. **النسخ الاحتياطي**: فعّل النسخ الاحتياطي في Supabase
3. **Rate Limiting**: أضف حدود للطلبات في الإنتاج
4. **المراقبة**: استخدم Vercel Analytics أو Sentry

---

## 🆘 الدعم

للمساعدة أو الإبلاغ عن مشاكل:
- GitHub Issues: [رابط المستودع]/issues
- البريد: support@xylo.com
