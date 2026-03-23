# Stage 1: Dependencies (with caching optimization)
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files for dependency installation
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Stage 2: Development Dependencies (for building)
FROM node:20-alpine AS dev-deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files and install ALL dependencies (including dev)
COPY package.json package-lock.json* ./
RUN npm ci

# Stage 3: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copy source and dependencies
COPY --from=dev-deps /app/node_modules ./node_modules
COPY . .

# Build the Next.js application
RUN npm run build

# Stage 4: Runner (final production image)
FROM node:20-alpine AS runner
WORKDIR /app

# Install dumb-init and other runtime dependencies
RUN apk add --no-cache dumb-init libc6-compat

# Set environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy production dependencies only
COPY --from=deps /app/node_modules ./node_modules

# Copy package.json for reference (optional)
COPY --from=builder /app/package.json ./package.json

# Fix permissions
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Environment variables for Next.js
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "fetch('http://localhost:3000').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" || exit 1

# Start with dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]