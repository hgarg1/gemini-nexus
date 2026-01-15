# Stage 1: Build
FROM node:22-bookworm-slim AS builder
WORKDIR /app
ENV npm_config_optional=true
ENV npm_config_ignore_optional=false

# Install required system dependencies (OpenSSL is critical for Prisma)
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Enable corepack for correct npm version
RUN corepack enable

# Copy source code
COPY . .

# Install dependencies
# We use --include=optional to ensure platform specific binaries (like @swc/core, prisma engines) are installed
RUN npm ci --include=optional \
    && npm i -D @tailwindcss/oxide-linux-x64-gnu@4.1.18

# Generate Prisma Client
# We use the root script which delegates to turbo to run it in the correct package context
RUN npm run db:generate

# Build the web application
# This will generate the .next/standalone folder due to output: "standalone" in next.config.js
RUN npm run build --workspace=apps/web

# Stage 2: Production Runner
FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Don't run as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy the standalone build from the builder stage
# The standalone folder contains a minimal node_modules and the server code
# We copy it to /app, preserving the apps/web structure inside
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/server.js"]