# ==========================================
# زايلو (Xylo) - Dockerfile بسيط للإنتاج
# ==========================================

FROM oven/bun:1 AS base
WORKDIR /app

# ====================
# Stage 1: Install dependencies
# ====================
FROM base AS deps

# Install openssl for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json bun.lock ./
COPY prisma ./prisma/

# Install dependencies
RUN bun install --frozen-lockfile || bun install

# ====================
# Stage 2: Build
# ====================
FROM base AS builder

# Install openssl for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Use PostgreSQL schema
RUN cp prisma/schema.prod.prisma prisma/schema.prisma || true

# Generate Prisma Client
RUN bunx prisma generate

# Build the application
RUN bun run build

# ====================
# Stage 3: Run
# ====================
FROM oven/bun:1-slim AS runner

# Install openssl and curl
RUN apt-get update && apt-get install -y openssl curl && rm -rf /var/lib/apt/lists/*

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
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
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
CMD ["sh", "-c", "bunx prisma db push --skip-generate || true && node server.js"]
