# 🚀 منصة زايلو (Xylo Platform)

منصة اجتماعية للمقالات تجمع بين جودة المحتوى ونظام دعم مالي لحظي. اقرأ، تعلم، وادعم كتابك المفضلين.

## ✨ المميزات

### 🎯 المصادقة
- **تسجيل الدخول عبر Google OAuth** - تجربة سلسة وسريعة
- **تسجيل بالبريد الإلكتروني** - مع التحقق من قوة كلمة المرور
- **دعم Supabase Auth** - نظام مصادقة موثوق وآمن
- **JWT Token** - للتوافق مع الأنظمة القديمة

### 💰 النظام المالي
- **نظام العملات (Coins)** - 1 دولار = 1000 عملة
- **نظام الألماس (Diamonds)** - للكتاب، قابل للسحب
- **الهدايا الافتراضية** - مع تأثيرات بصرية لحظية
- **عمولة المنصة** - 10% من عمليات السحب

### 📝 المحتوى
- **مقالات متعددة اللغات** - دعم RTL للعربية
- **تصنيفات ووسوم** - تنظيم فعال للمحتوى
- **نظام الإبلاغ** - للحفاظ على جودة المحتوى

### 🔒 الأمان
- **تشفير AES-256-GCM** - للمفاتيح والرسائل الحساسة
- **KYC للكتاب** - للسحب الآمن
- **Middleware للحماية** - حماية المسارات الحساسة

## 🛠️ التقنيات المستخدمة

- **Next.js 16** - مع App Router
- **TypeScript 5** - للكتابة الآمنة
- **Prisma ORM** - لقاعدة البيانات
- **Supabase** - للمصادقة وقاعدة البيانات
- **Tailwind CSS 4** - للتصميم
- **shadcn/ui** - مكونات UI

## 🚀 البدء السريع

### 1. تثبيت التبعيات
```bash
bun install
```

### 2. إعداد Supabase

#### أ. إنشاء مشروع Supabase
1. اذهب إلى [supabase.com](https://supabase.com)
2. أنشئ مشروعاً جديداً
3. احصل على:
   - Project URL
   - Anon/Public Key
   - Database Password

#### ب. إعداد Google OAuth
1. اذهب إلى **Authentication > Providers** في Supabase
2. فعّل **Google** provider
3. أنشئ مشروعاً في [Google Cloud Console](https://console.cloud.google.com)
4. احصل على `Client ID` و `Client Secret`
5. أضف `https://[PROJECT_REF].supabase.co/auth/v1/callback` كـ Authorized redirect URI
6. أدخل البيانات في Supabase

#### ج. تحديث ملف .env
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Database URL (Direct connection for Prisma)
DATABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@db.your-project.supabase.co:5432/postgres

# JWT Secret
JWT_SECRET=your-secret-key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. تهيئة قاعدة البيانات
```bash
# إنشاء الجداول
bun run db:push

# أو استخدام migrations
bun run db:migrate
```

### 4. تشغيل الخادم
```bash
bun run dev
```

افتح [http://localhost:3000](http://localhost:3000) في المتصفح.

## 📁 هيكل المشروع

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   └── auth/          # المصادقة
│   │       ├── login/
│   │       ├── register/
│   │       ├── callback/  # OAuth callback
│   │       └── complete-profile/
│   ├── auth/              # صفحات المصادقة
│   └── page.tsx           # الصفحة الرئيسية
├── components/
│   └── ui/                # shadcn/ui components
├── lib/
│   ├── supabase/          # Supabase clients
│   │   ├── client.ts      # Client-side
│   │   └── server.ts      # Server-side
│   ├── encryption/        # نظام التشفير
│   ├── financial/         # الخدمات المالية
│   ├── payment/           # بوابات الدفع
│   └── auth.ts            # JWT helpers
├── i18n/                  # التعدد اللغوي
└── middleware.ts          # حماية المسارات
```

## 🔐 المصادقة

### استخدام Google OAuth
```typescript
import { signInWithGoogle } from '@/lib/supabase/client';

// في المكون
const handleGoogleLogin = async () => {
  const result = await signInWithGoogle();
  if (result.error) {
    // معالجة الخطأ
  }
  // سيتم التحويل تلقائياً إلى Google
};
```

### استخدام البريد الإلكتروني
```typescript
import { signInWithEmail, signUpWithEmail } from '@/lib/supabase/client';

// تسجيل الدخول
const result = await signInWithEmail(email, password);

// إنشاء حساب
const result = await signUpWithEmail(email, password, { name, username });
```

### حماية المسارات (Server-side)
```typescript
import { withAuth, withAdminAuth, withWriterAuth } from '@/lib/api-utils';

// مسار محمي
export async function GET(request: NextRequest) {
  const authResult = await withAuth(request);
  if (!authResult.authenticated) {
    return authResult.error;
  }
  // المستخدم متاح في authResult.user
}
```

## 💰 نظام العملات

| العملة | الوصف | التحويل |
|--------|-------|---------|
| Coins | للقراء، للشراء | 1 USD = 1000 coins |
| Diamonds | للكتاب، للسحب | 1000 diamonds = 1 USD |

### باقات الشراء
- $1 = 1,000 عملة
- $5 = 5,000 عملة
- $10 = 10,000 عملة

### نظام الإحالة
- مكافأة التسجيل: 100 عملة للمُحيل
- عمولة الشراء: 50 عملة لكل $1 ينفقه المُحال

## 🌍 التعدد اللغوي

اللغات المدعومة:
- 🇸🇦 العربية (الافتراضية) - RTL
- 🇺🇸 الإنجليزية - LTR
- 🇹🇷 التركية - LTR

```typescript
// استخدام الترجمة
import { useTranslation } from '@/i18n/use-translation';

const { t } = useTranslation('ar');
console.log(t('welcome'));
```

## 📊 API Endpoints

### المصادقة
- `POST /api/auth/register` - إنشاء حساب
- `POST /api/auth/login` - تسجيل الدخول
- `POST /api/auth/logout` - تسجيل الخروج
- `GET /api/auth/me` - بيانات المستخدم الحالي
- `POST /api/auth/complete-profile` - إكمال الملف الشخصي

### المحفظة
- `GET /api/wallet` - رصيد المحفظة
- `POST /api/wallet/purchase-coins` - شراء عملات
- `POST /api/wallet/withdraw` - طلب سحب
- `GET /api/wallet/transactions` - سجل المعاملات

### المقالات
- `GET /api/articles` - قائمة المقالات
- `POST /api/articles` - إنشاء مقال
- `GET /api/articles/[id]` - تفاصيل مقال
- `POST /api/articles/[id]/publish` - نشر مقال

### الهدايا
- `GET /api/gifts` - قائمة الهدايا
- `POST /api/gifts/send` - إرسال هدية

## 🚀 النشر

### Vercel (موصى به)
```bash
# تثبيت Vercel CLI
npm i -g vercel

# النشر
vercel
```

### متغيرات البيئة المطلوبة
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DATABASE_URL`
- `JWT_SECRET`

## 📝 الترخيص

هذا المشروع مرخص تحت رخصة MIT.

---

Built with ❤️ for the Arabic content community.
