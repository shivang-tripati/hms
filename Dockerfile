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

RUN npx prisma generate

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

# Copy only necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set correct permissions
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose app port
EXPOSE 3000

# Healthcheck (basic HTTP check)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "fetch('http://localhost:3000').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Fail-fast + start app
ENTRYPOINT ["dumb-init", "--"]
CMD ["sh", "-c", "test -f server.js || (echo 'ERROR: server.js not found. Ensure Next.js standalone build is enabled.' && exit 1); node server.js"]