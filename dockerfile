# Stage 1: Build (Debian slim)
FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN corepack enable
RUN corepack prepare npm@11.7.0 --activate
# (Optional but recommended) CA certs for fetching deps + prisma engines cleanly
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Copy root lockfiles for dependency resolution
COPY package.json package-lock.json ./

# Copy workspace folders to preserve structure
COPY apps/web ./apps/web
COPY packages ./packages
# You were copying prisma schema into /prisma; keep that behavior
COPY packages/database/prisma ./prisma

# Install dependencies for the whole repo
RUN npm ci

# Generate Prisma client and build only the web app
RUN npx prisma generate
RUN npm run build --workspace=apps/web


# Stage 2: Runtime (Debian slim)
FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable
RUN corepack prepare npm@11.7.0 --activate

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Install only production deps for the web app (as you were doing)
COPY --from=build /app/apps/web/package.json ./package.json
COPY --from=build /app/package-lock.json ./package-lock.json
RUN npm ci --omit=dev

# Copy built Next.js artifacts
COPY --from=build /app/apps/web/.next ./.next
COPY --from=build /app/apps/web/public ./public
COPY --from=build /app/apps/web/scripts ./scripts

# Copy Prisma engine directory produced during build (used by @prisma/client at runtime)
# This matches your existing approach.
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

# If your app expects the Prisma schema/migrations at runtime (often not needed),
# uncomment the next line:
# COPY --from=build /app/prisma ./prisma

RUN chmod +x ./scripts/docker-entrypoint.sh
EXPOSE 3000

ENTRYPOINT ["./scripts/docker-entrypoint.sh"]
CMD ["npm", "start"]
