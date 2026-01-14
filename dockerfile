# Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /app

# Copy root lockfiles for dependency resolution
COPY package.json package-lock.json ./
# Copy workspace folders to preserve structure
COPY apps/web ./apps/web
COPY packages ./packages
COPY packages/database/prisma ./prisma

# Install dependencies for the whole repo
RUN npm ci

# Generate Prisma client and build only the web app
RUN npx prisma generate
RUN npm run build --workspace=apps/web

# Stage 2: Runtime
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/apps/web/package.json ./package.json
RUN npm ci --omit=dev

# Copy built Next.js artifacts
COPY --from=build /app/apps/web/.next ./.next
COPY --from=build /app/apps/web/public ./public
COPY --from=build /app/apps/web/scripts ./scripts
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

RUN chmod +x ./scripts/docker-entrypoint.sh
EXPOSE 3000

ENTRYPOINT ["./scripts/docker-entrypoint.sh"]
CMD ["npm", "start"]