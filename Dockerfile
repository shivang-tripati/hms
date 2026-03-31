# -------- Stage 1: Install dependencies --------
FROM node:20-alpine AS deps
WORKDIR /app

# Install required system packages
RUN apk add --no-cache libc6-compat

# Copy only package files (for better caching)
COPY package.json package-lock.json* ./

# Install all dependencies (needed for build)
RUN npm ci


# -------- Stage 2: Build the app --------
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY --from=deps /app/node_modules ./node_modules

COPY . .

RUN npx prisma generate --schema=./prisma/schema.prisma

# Build Next.js (standalone)
RUN npm run build && \
    test -d .next/standalone && \
    test -f .next/standalone/server.js


# -------- Stage 3: Production runner --------
FROM node:20-alpine AS runner
WORKDIR /app



# Install minimal runtime deps
RUN apk add --no-cache dumb-init libc6-compat openssl

# Environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

#  FIXED: Copy standalone built app
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

#  FIXED: Copy node_modules (CRITICAL - was missing!)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

#  ADD THIS: Copy prisma directory for migrations
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Copy public assets
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy static files
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

COPY --chown=nextjs:nodejs entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh


# Switch to non-root user
USER nextjs

# Expose app port
EXPOSE 3000

# Healthcheck - simple and reliable
HEALTHCHECK --interval=30s --timeout=10s --start-period=45s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000', (r) => process.exit(r.statusCode < 500 ? 0 : 1))" || exit 1

# Fail-fast + start app
ENTRYPOINT ["dumb-init", "--", "/app/entrypoint.sh"]