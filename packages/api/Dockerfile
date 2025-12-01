# Multi-stage Dockerfile für ShareLocal API
# Node.js 24.x LTS (Krypton)
# Standalone build - treats API as independent package

# Stage 1: Build API
FROM node:24-alpine AS api-builder
WORKDIR /app

# Install build dependencies for Prisma (needed for native binaries)
RUN apk add --no-cache libc6-compat openssl

# Copy API source
COPY packages/api/package.json ./package.json
COPY packages/api/src ./src
COPY packages/api/tsconfig.json ./tsconfig.json

# Copy Prisma schema and migrations for migration execution
COPY packages/database/prisma ./packages/database/prisma

# Install ALL dependencies with npm (standalone)
# This installs dotenv, @prisma/client, express, etc. directly from package.json
RUN npm install --legacy-peer-deps

# Generate Prisma Client (with proper binary targets for Alpine)
RUN npm install -D prisma@^5.19.0 && \
    npx prisma generate --schema=./packages/database/prisma/schema.prisma --generator client && \
    npm uninstall prisma

# Build API
RUN npm run build

# Stage 2: Production
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install runtime dependencies for Prisma (needed for native binaries)
RUN apk add --no-cache libc6-compat openssl

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

# Copy package.json and built application
COPY --from=api-builder --chown=nodejs:nodejs /app/package.json ./package.json
COPY --from=api-builder --chown=nodejs:nodejs /app/dist ./dist
# Copy Prisma schema and migrations for migration execution
COPY --from=api-builder --chown=nodejs:nodejs /app/packages/database/prisma ./packages/database/prisma

# Copy all node_modules (includes dotenv and all dependencies)
# Simple copy - no workspace complexity
# Prisma Engine binaries are included in node_modules/.prisma/client
COPY --from=api-builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Prisma 5.22+ verwendet .so.node Dateien statt ausführbarer Binaries
# Die Dateien werden automatisch mit korrekten Berechtigungen kopiert durch --chown
# Kein chmod nötig für .so.node Dateien (sie sind Shared Libraries, keine Executables)

# Set user
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "dist/index.js"]
