# ==========================================
# زايلو (Xylo) - Dockerfile for Railway
# ==========================================

# Stage 1: Base
FROM node:20-alpine AS base

# Install dependencies for native modules
RUN apk add --no-cache libc6-compat openssl python3 make g++ curl

WORKDIR /app

# ====================
# Stage 2: Dependencies
# ====================
FROM base AS deps

# Copy package files first for better caching
COPY package.json ./
COPY prisma ./prisma/

# Use PostgreSQL schema for production build
RUN if [ -f "prisma/schema.prod.prisma" ]; then \
    cp prisma/schema.prod.prisma prisma/schema.prisma; \
    fi

# Install all dependencies (including devDependencies for build)
RUN npm install --legacy-peer-deps

# Generate Prisma Client with PostgreSQL schema
RUN npx prisma generate

# ====================
# Stage 3: Builder
# ====================
FROM base AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Ensure PostgreSQL schema is used
RUN if [ -f "prisma/schema.prod.prisma" ]; then \
    cp prisma/schema.prod.prisma prisma/schema.prisma; \
    fi

# Regenerate Prisma Client to ensure correct schema
RUN npx prisma generate

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the Next.js application
# The build script already handles copying static files and public folder
RUN npm run build

# ====================
# Stage 4: Runner
# ====================
FROM node:20-alpine AS runner

# Install runtime dependencies
RUN apk add --no-cache openssl curl

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy Prisma files for database migrations
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

# Copy package.json for prisma commands
COPY --from=builder /app/package.json ./

# Set proper permissions
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port (Railway sets PORT env var)
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || curl -f http://localhost:3000/ || exit 1

# Start script: Run prisma migrate deploy then start server
# Using migrate deploy for production (applies migrations without creating new ones)
CMD ["sh", "-c", "npx prisma migrate deploy || npx prisma db push --skip-generate || true && node server.js"]
