# ==========================================
# زايلو (Xylo) - Dockerfile محسّن للإنتاج
# ==========================================

# ====================
# Stage 1: Dependencies
# ====================
FROM node:20-alpine AS deps

# تثبيت الأدوات المطلوبة
RUN apk add --no-cache libc6-compat openssl python3 make g++

WORKDIR /app

# تثبيت Bun
RUN npm install -g bun

# نسخ ملفات الحزم أولاً (للاستفادة من الـ cache)
COPY package.json bun.lock* ./
COPY prisma ./prisma/

# تثبيت التبعيات (بدون frozen-lockfile لتجنب الأخطاء)
RUN bun install

# ====================
# Stage 2: Builder
# ====================
FROM node:20-alpine AS builder

WORKDIR /app

# تثبيت Bun والأدوات المطلوبة
RUN npm install -g bun
RUN apk add --no-cache openssl python3 make g++

# نسخ التبعيات من المرحلة السابقة
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# متغيرات البيئة للبناء
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV SKIP_ENV_VALIDATION=1

# استخدام schema الإنتاجي (PostgreSQL)
RUN cp prisma/schema.prod.prisma prisma/schema.prisma

# توليد Prisma Client
RUN bunx prisma generate

# بناء التطبيق
RUN bun run build

# ====================
# Stage 3: Runner
# ====================
FROM node:20-alpine AS runner

WORKDIR /app

# تثبيت الأدوات المطلوبة للتشغيل
RUN apk add --no-cache openssl curl

# متغيرات البيئة
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# إنشاء مستخدم غير root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# نسخ الملفات الضرورية
COPY --from=builder /app/public ./public

# نسخ ملفات البناء المستقلة
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# نسخ ملفات Prisma للـ runtime
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/package.json ./

# تعيين الصلاحيات
RUN chown -R nextjs:nodejs /app

# التبديل للمستخدم غير root
USER nextjs

# المنفذ
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check محسّن
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
  CMD curl -f http://localhost:3000/api || exit 1

# أمر التشغيل - مزامنة قاعدة البيانات ثم تشغيل الخادم
CMD ["sh", "-c", "node ./node_modules/prisma/build/index.js db push --skip-generate && node server.js"]
