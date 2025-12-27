FROM node:18-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Prune
FROM base AS pruner
WORKDIR /app
COPY . .
RUN pnpm --filter backend deploy --prod /app/pruned

# Build
FROM base AS builder
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter backend build

# Production
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Copy pruned node_modules (production dependencies only)
COPY --from=pruner /app/pruned/node_modules ./node_modules
COPY --from=pruner /app/pruned/package.json ./package.json

# Copy built assets
COPY --from=builder /app/apps/backend/dist ./dist
# Copy prisma if needed for runtime (though usually client is in node_modules)
COPY --from=builder /app/apps/backend/prisma ./prisma

EXPOSE 3000

CMD ["node", "dist/main"]
