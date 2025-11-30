# Multi-stage Dockerfile für ShareLocal API
# Node.js 24.x LTS (Krypton)

# Stage 1: Dependencies
FROM node:24-alpine AS deps
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/api/package.json ./packages/api/
COPY packages/shared/package.json ./packages/shared/
COPY packages/database/package.json ./packages/database/

# Install dependencies (production only in final stage)
# Note: We install all deps here for build stage, will filter in production stage
RUN pnpm install --frozen-lockfile

# Stage 2: Build
FROM node:24-alpine AS builder
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages

# Copy source code
COPY packages/api ./packages/api
COPY packages/shared ./packages/shared
COPY packages/database ./packages/database
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# Generate Prisma Client
# prisma generate only needs the schema, no database connection required
RUN pnpm --filter @sharelocal/database db:generate

# Build shared package
RUN pnpm --filter @sharelocal/shared build

# Build API
RUN pnpm --filter @sharelocal/api build

# Stage 3: Production
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Create non-root user (we'll switch to it after installing dependencies)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

# Copy package files for production install
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/packages/api/package.json ./packages/api/package.json
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /app/packages/database/package.json ./packages/database/package.json

# Copy Prisma schema (needed for Prisma generate)
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma

# Install production dependencies only
# This ensures all dependencies (including dotenv) are properly installed
RUN pnpm install --frozen-lockfile --prod

# Generate Prisma Client (prisma CLI is needed, install temporarily)
# prisma generate only needs the schema, no database connection required
RUN pnpm add -D -w prisma@^5.19.0 && \
    pnpm --filter @sharelocal/database db:generate && \
    pnpm remove -w prisma

# Copy built application and shared package (if needed)
COPY --from=builder --chown=nodejs:nodejs /app/packages/api/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/shared/dist ./packages/shared/dist

# Set user
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "dist/index.js"]

