# Build Stage
FROM node:18-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy all files for monorepo build context
COPY . .

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build frontend
RUN pnpm --filter @nestbase/frontend build

# Production Stage
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
