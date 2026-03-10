# 🚀 دليل نشر منصة زايلو على Northflank

## 📋 المتطلبات

1. حساب على [Northflank](https://northflank.com)
2. مستودع GitHub أو GitLab أو Bitbucket
3. قاعدة بيانات PostgreSQL (توفرها Northflank)

---

## 🔄 الخطوة 1: رفع المشروع إلى GitHub

```bash
# إنشاء مستودع جديد على GitHub
# ثم اتبع الخطوات التالية:

cd /home/z/my-project

# تهيئة Git إذا لم يكن مهيأً
git init

# إضافة جميع الملفات
git add .

# إنشاء commit
git commit -m "Initial commit: Xylo Platform"

# إضافة المستودع البعيد
git remote add origin https://github.com/YOUR_USERNAME/xylo-platform.git

# رفع الكود
git push -u origin main
```

---

## 🗄️ الخطوة 2: إنشاء قاعدة بيانات PostgreSQL على Northflank

1. سجل دخولك إلى [Northflank Dashboard](https://app.northflank.com)
2. انتقل إلى **Addons** > **Create Addon**
3. اختر **PostgreSQL**
4. املأ البيانات:
   - **Name**: `xylo-database`
   - **Version**: PostgreSQL 15
   - **Plan**: اختر الخطة المناسبة (يُنصح بـ Standard Small للبدء)
   - **Region**: اختر الأقرب لك

5. بعد الإنشاء، انسخ **Connection String** من تفاصيل القاعدة
   - سيكون شكله: `postgresql://user:password@host:5432/database`

---

## 🚀 الخطوة 3: إنشاء خدمة جديدة (Deployment)

1. من Dashboard، اضغط **New Service** > **Deployment**
2. املأ البيانات الأساسية:
   - **Name**: `xylo-platform`
   - **Description**: `منصة دعم صُنّاع المحتوى العربي`

3. اربط المستودع:
   - اختر **Git Repository**
   - اربط حساب GitHub الخاص بك
   - اختر مستودع `xylo-platform`
   - **Branch**: `main`

4. إعدادات البناء (Build):
   - **Build Type**: Dockerfile
   - **Dockerfile Path**: `./Dockerfile`
   - **Context**: `.`

5. إعدادات الموارد:
   - **CPU**: 0.5 vCPU
   - **Memory**: 512 MB
   - **Replicas**: 1

---

## 🔐 الخطوة 4: إضافة متغيرات البيئة

في صفحة **Environment Variables**، أضف المتغيرات التالية:

### متغيرات إلزامية:

| المتغير | القيمة | الوصف |
|---------|--------|-------|
| `DATABASE_URL` | `postgresql://...` | رابط قاعدة البيانات (من الخطوة 2) |
| `JWT_SECRET` | `xylo-super-secret-key-change-me` | مفتاح JWT (غيّره لقيمة عشوائية قوية) |

### متغيرات اختيارية:

| المتغير | القيمة | الوصف |
|---------|--------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | رابط Supabase (للتخزين) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `xxx` | مفتاح Supabase العام |
| `NEXT_PUBLIC_APP_URL` | `https://xylo.northflank.app` | رابط التطبيق |

---

## 🌐 الخطوة 5: إعداد Domain

1. في صفحة **Networking**:
   - فعّل **Public HTTP Endpoint**
   - **Port**: `3000`
   - **Protocol**: `HTTP`

2. للحصول على نطاق مجاني:
   - اضغط **Generate Domain**
   - ستحصل على نطاق مثل: `xylo-platform-xxx.northflank.app`

3. لإضافة نطاق مخصص:
   - اضغط **Add Custom Domain**
   - أدخل نطاقك (مثل: `xylo.yourdomain.com`)
   - أضف سجلات DNS المطلوبة

---

## ✅ الخطوة 6: النشر والتشغيل

1. اضغط **Create & Deploy**
2. انتظر حتى يكتمل البناء (عادة 3-5 دقائق)
3. راقب الـ Logs للتأكد من نجاح النشر

### ما يحدث تلقائياً:

```bash
# 1. تشغيل Prisma Migrations
npx prisma migrate deploy

# 2. تشغيل Seed (إنشاء البيانات الأولية)
npx prisma db seed

# 3. تشغيل الخادم
node server.js
```

---

## 🎉 الخطوة 7: الوصول للمنصة

بعد نجاح النشر:

1. افتح الرابط المخصص: `https://xylo-platform-xxx.northflank.app`
2. سجل الدخول بحساب المسؤول:
   - **البريد**: `admin@xylo.com`
   - **كلمة المرور**: `admin123456`

⚠️ **غيّر كلمة المرور فوراً بعد أول دخول!**

---

## 🔄 التحديثات المستقبلية

لتحديث المنصة:

```bash
# 1. قم بالتعديلات محلياً
# 2. ارفع التغييرات
git add .
git commit -m "Update: description of changes"
git push

# 3. Northflank سيقوم بالنشر تلقائياً
```

---

## 🐛 استكشاف الأخطاء

### المشكلة: خطأ في الاتصال بقاعدة البيانات
- تأكد من صحة `DATABASE_URL`
- تأكد من أن قاعدة البيانات تعمل

### المشكلة: خطأ في البناء (Build Failed)
- راجع Build Logs
- تأكد من صحة Dockerfile

### المشكلة: الموقع لا يعمل
- راجع Runtime Logs
- تأكد من أن المنفذ 3000 مفتوح

---

## 📞 الدعم

- [Northflank Documentation](https://northflank.com/docs)
- [Northflank Support](https://northflank.com/support)

---

## 🏗️ هيكل الملفات للنشر

```
xylo-platform/
├── Dockerfile              # إعداد Docker
├── .dockerignore           # ملفات مستثناة
├── northflank.json         # إعدادات Northflank
├── .env.production.example # نموذج متغيرات الإنتاج
├── prisma/
│   ├── schema.prisma       # مخطط SQLite (تطوير)
│   ├── schema.prod.prisma  # مخطط PostgreSQL (إنتاج)
│   └── seed.ts             # البيانات الأولية
├── src/                    # الكود المصدري
└── package.json            # التبعيات
```

---

**🚀 مبروك! منصة زايلو جاهزة للعمل على Northflank!**
