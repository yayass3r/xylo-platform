# ==========================================
# زايلو (Xylo) - Dockerfile للإنتاج (Node.js)
# ==========================================

FROM node:20-alpine AS base

# Install dependencies for building native modules
RUN apk add --no-cache libc6-compat openssl python3 make g++

WORKDIR /app

# ====================
# Stage 1: Dependencies
# ====================
FROM base AS deps

# Copy package files
COPY package.json ./
COPY prisma ./prisma/

# Install dependencies with npm (no package-lock.json)
RUN npm install --legacy-peer-deps

# ====================
# Stage 2: Build
# ====================
FROM base AS builder

WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Use PostgreSQL schema
RUN if [ -f "prisma/schema.prod.prisma" ]; then cp prisma/schema.prod.prisma prisma/schema.prisma; fi

# Generate Prisma Client
RUN npx prisma generate

# Build the application
RUN npm run build

# ====================
# Stage 3: Runner
# ====================
FROM node:20-alpine AS runner

# Install openssl and curl for health checks
RUN apk add --no-cache openssl curl

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/package.json ./

# Permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

# Start: push schema then run server
CMD ["sh", "-c", "npx prisma db push --skip-generate || true && node server.js"]
