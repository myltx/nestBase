# Claude Code Context for NestBase

This file contains essential information for Claude Code instances working in this repository.

---

## 🏗️ Architecture Overview

### Monorepo Structure

This is a **pnpm workspace monorepo** designed for frontend-backend collaboration:

```
nestbase/
├── apps/
│   ├── backend/          # NestJS application
│   └── frontend/         # Frontend application (placeholder)
├── packages/             # Shared packages (future)
└── pnpm-workspace.yaml   # Workspace configuration
```

**Key Point**: Commands can be run from root using `pnpm --filter <app>` or directly in app directories.

### NestJS Backend Architecture

**Global Providers** (configured in `app.module.ts`):
1. **JwtAuthGuard** (APP_GUARD) - Enforces authentication on all routes by default
2. **TransformInterceptor** (APP_INTERCEPTOR) - Wraps all responses in unified format
3. **HttpExceptionFilter** (APP_FILTER) - Centralizes error handling

This means:
- All routes require JWT authentication unless decorated with `@Public()`
- All responses follow `{ success: boolean, data: any, message?: string }` format
- All errors are caught and formatted consistently

**Module Structure**:
```
src/
├── common/                    # Shared utilities
│   ├── decorators/           # @Public, @Roles, @CurrentUser
│   ├── guards/               # JwtAuthGuard, RolesGuard
│   ├── interceptors/         # TransformInterceptor
│   └── filters/              # HttpExceptionFilter
├── modules/
│   ├── prisma/               # Global database module
│   ├── auth/                 # JWT authentication (register, login)
│   └── users/                # User CRUD with RBAC
├── config/
│   └── swagger.config.ts     # Swagger/OpenAPI configuration
└── main.ts                   # Bootstrap with global pipes
```

**Path Aliases** (configured in `tsconfig.json`):
- `@common/*` → `src/common/*`
- `@modules/*` → `src/modules/*`
- `@config/*` → `src/config/*`

---

## 🗄️ Database Configuration (Critical)

### Supabase IPv4 Network Requirements

**IMPORTANT**: This project uses Supabase with **IPv4 network** configuration, which requires specific setup:

1. **Two Database URLs Required**:
   - `DATABASE_URL` (port 6543) - Transaction mode for application runtime
   - `DIRECT_URL` (port 5432) - Session mode for database migrations

2. **Must Use Session Pooler**:
   ```env
   # ✅ Correct for IPv4
   DATABASE_URL="postgresql://postgres.[ref]:[PASSWORD]@aws-x-region.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
   DIRECT_URL="postgresql://postgres.[ref]:[PASSWORD]@aws-x-region.pooler.supabase.com:5432/postgres"

   # ❌ Wrong - Direct connection doesn't work on IPv4
   DATABASE_URL="postgresql://...@db.xxxxx.supabase.co:5432/postgres"
   ```

3. **Password URL Encoding**:
   Special characters in passwords MUST be URL encoded:
   - `@` → `%40`
   - `#` → `%23`
   - `$` → `%24`
   - `%` → `%25`
   - `&` → `%26`
   - `+` → `%2B`
   - `/` → `%2F`
   - `:` → `%3A`
   - `=` → `%3D`
   - `?` → `%3F`
   - ` ` (space) → `%20`

   Example: `ll940223..@@` → `ll940223..%40%40`

4. **Prisma Schema Configuration**:
   ```prisma
   datasource db {
     provider  = "postgresql"
     url       = env("DATABASE_URL")      // Runtime queries
     directUrl = env("DIRECT_URL")        // Migrations
   }
   ```

**Reference**: See `SUPABASE_SETUP.md` for complete configuration guide.

---

## 🚀 Common Development Commands

### From Root Directory

```bash
# Install all dependencies
pnpm install

# Start backend in development mode (hot reload)
pnpm dev

# Build backend for production
pnpm build

# Start production build
pnpm start

# Generate Prisma Client
pnpm prisma:generate

# Push database schema (development)
pnpm prisma:push

# Run database migrations (production)
pnpm prisma:migrate

# Seed database with test data
pnpm prisma:seed

# Open Prisma Studio (database GUI)
pnpm prisma:studio
```

### From apps/backend Directory

```bash
# Development server
pnpm dev

# Build
pnpm build

# Production server
pnpm start:prod

# Prisma commands
npx prisma generate           # Generate Prisma Client
npx prisma db push            # Push schema to database (dev)
npx prisma migrate dev        # Create and apply migrations
npx prisma migrate deploy     # Deploy migrations (production)
npx prisma studio             # Open database GUI
pnpm seed                     # Run seed script

# TypeScript type checking
npx tsc --noEmit

# Format code
pnpm format

# Lint code
pnpm lint
```

### Quick Start Script

```bash
# Automated setup and startup
./start.sh
```

This script automatically:
- Checks environment (Node.js, pnpm)
- Installs dependencies if needed
- Creates `.env` from `.env.example`
- Generates Prisma Client
- Tests database connection
- Finds available port
- Starts application

---

## 🔄 Development Workflow

### Initial Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cd apps/backend
cp .env.example .env
# Edit .env with Supabase credentials (remember URL encoding!)

# 3. Generate Prisma Client
npx prisma generate

# 4. Push schema to database
npx prisma db push

# 5. (Optional) Seed test data
cd ../..
pnpm prisma:seed

# 6. Start development server
pnpm dev
```

### After Schema Changes

```bash
# Development workflow
cd apps/backend
npx prisma db push              # Push changes
npx prisma generate             # Regenerate client
cd ../..
pnpm dev                        # Restart server

# Production workflow
cd apps/backend
npx prisma migrate dev --name description_of_change
npx prisma generate
```

### Database Reset

```bash
cd apps/backend
npx prisma migrate reset        # Resets DB, runs migrations, runs seed
# Or manually:
npx prisma db push --force-reset
pnpm seed
```

---

## 🔐 Authentication & Authorization

### How It Works

1. **Global Authentication**: `JwtAuthGuard` is applied globally via `APP_GUARD`
2. **Public Routes**: Use `@Public()` decorator to bypass authentication
3. **Role-Based Access**: Use `@Roles(Role.ADMIN, Role.MODERATOR)` for RBAC
4. **Current User**: Use `@CurrentUser()` decorator to get authenticated user

### Example Route

```typescript
@Controller('users')
export class UsersController {
  // Public route (no authentication required)
  @Public()
  @Get('public')
  getPublicData() { ... }

  // Authenticated route (requires JWT)
  @Get('profile')
  getProfile(@CurrentUser() user: User) { ... }

  // Admin-only route
  @Roles(Role.ADMIN)
  @Delete(':id')
  deleteUser(@Param('id') id: string) { ... }
}
```

### Roles

Defined in `prisma/schema.prisma`:
- `USER` (default) - Standard user
- `MODERATOR` - Elevated permissions
- `ADMIN` - Full system access

---

## 📚 API Documentation

### Swagger UI

Available at: `http://localhost:3000/api-docs`

- All endpoints automatically documented via decorators
- Online API testing interface
- JWT authentication support (click "Authorize" button)

### API Structure

Base URL: `http://localhost:3000/api`

**Authentication** (`/api/auth`):
- `POST /auth/register` - Register new user (public)
- `POST /auth/login` - Login (public)
- `GET /auth/profile` - Get current user info (authenticated)

**Users** (`/api/users`):
- `POST /users` - Create user (admin only)
- `GET /users?current=1&size=10` - List users with pagination & search (authenticated)
- `GET /users/:id` - Get user by ID (authenticated)
- `PATCH /users/:id` - Update user (admin only)
- `DELETE /users/:id` - Delete user (admin only)

**Projects** (`/api/projects`):
- `POST /projects` - Create project (admin only)
- `GET /projects?current=1&size=10` - List projects with pagination & filters (public)
- `GET /projects/featured` - Get all featured projects (public)
- `GET /projects/tech-stack` - Get all tech stack (public)
- `GET /projects/:id` - Get project by ID (public)
- `PATCH /projects/:id` - Update project (admin only)
- `PATCH /projects/:id/toggle-featured` - Toggle featured status (admin only)
- `DELETE /projects/:id` - Delete project (admin only)

**System** (`/api/swagger`):
- `GET /swagger/json` - Get OpenAPI JSON document (public, no wrapping)
- `GET /swagger/stats` - Get API statistics (public, wrapped)

---

## 🧪 Testing Workflow

### Test Accounts

After running `pnpm prisma:seed`:
- Admin: `admin@example.com` / `admin123`
- User: `user@example.com` / `user123`

### Manual API Testing

```bash
# 1. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

# 2. Use token from response
TOKEN="eyJhbGc..."

# 3. Make authenticated request
curl http://localhost:3000/api/users \
  -H "Authorization: Bearer $TOKEN"
```

Or use Swagger UI at `/api-docs` for easier testing.

---

## ⚠️ Common Issues

### Issue 1: Prisma Client Not Generated

**Error**: `Module '@prisma/client' has no exported member 'Role'`

**Solution**:
```bash
cd apps/backend
npx prisma generate
```

### Issue 2: Database Connection Failed

**Error**: `Can't reach database server` or `Authentication failed`

**Solutions**:
1. Verify `.env` file exists in `apps/backend/`
2. Check password URL encoding (especially `@` → `%40`)
3. Ensure using Session Pooler URLs (with `pooler.supabase.com`)
4. Test connection: `cd apps/backend && npx prisma db push`

### Issue 3: Port Already in Use

**Error**: `EADDRINUSE: address already in use`

**Solution**:
```bash
# Find and kill process
lsof -ti:3000 | xargs kill -9

# Or change port in .env
PORT=3001
```

### Issue 4: TypeScript Errors After Schema Changes

**Solution**:
```bash
cd apps/backend
npx prisma generate  # Regenerate Prisma Client
npx tsc --noEmit     # Verify types
```

---

## 🔧 Configuration Files

### Environment Variables

Located in `apps/backend/.env` (create from `.env.example`):

**Required Variables**:
- `DATABASE_URL` - Supabase connection (port 6543, Transaction mode)
- `DIRECT_URL` - Supabase connection (port 5432, Session mode)
- `JWT_SECRET` - Secret key for JWT signing (generate with `openssl rand -base64 32`)
- `JWT_EXPIRES_IN` - Token expiration (e.g., "7d", "24h")

**Optional Variables**:
- `PORT` - Application port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `API_PREFIX` - API route prefix (default: "api")
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

### Key Configuration Files

- `pnpm-workspace.yaml` - Monorepo workspace definition
- `apps/backend/prisma/schema.prisma` - Database schema
- `apps/backend/tsconfig.json` - TypeScript config with path aliases
- `apps/backend/nest-cli.json` - NestJS CLI configuration
- `apps/backend/webpack.config.js` - Webpack config for hot reload

---

## 📦 Dependencies

### Core Technologies

- **NestJS 10.4.x** - Backend framework
- **Prisma 5.22.x** - ORM and database toolkit
- **PostgreSQL** - Database (via Supabase)
- **TypeScript 5.x** - Programming language
- **pnpm 9.x** - Package manager

### Key Libraries

- `@nestjs/passport` + `passport-jwt` - JWT authentication
- `@nestjs/swagger` - API documentation
- `class-validator` + `class-transformer` - DTO validation
- `bcrypt` - Password hashing

---

## 🎯 Code Patterns

### Data Transfer Objects (DTOs)

Use `class-validator` decorators for automatic validation:

```typescript
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}
```

### Response Format

All responses automatically wrapped by `TransformInterceptor`:

```typescript
// Success response
{
  "success": true,
  "data": { ... }
}

// Error response
{
  "success": false,
  "message": "Error description",
  "statusCode": 400,
  "timestamp": "2025-10-15T..."
}
```

### Prisma Service Pattern

```typescript
@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany();
  }
}
```

---

## 📖 Additional Documentation

- `README.md` - Main project documentation
- `QUICKSTART.md` - 4-step quick start guide
- `SUPABASE_SETUP.md` - Detailed Supabase configuration (400+ lines)
- `PROJECT_DELIVERY.md` - Project completion report
- `MONOREPO.md` - Monorepo architecture details

---

## 🚨 Important Notes

1. **Never commit `.env` files** - Already in `.gitignore`
2. **Always URL encode passwords** - Especially `@` character
3. **Use `db push` in development** - Faster than migrations
4. **Use `migrate` in production** - Version-controlled schema changes
5. **Generate Prisma Client after schema changes** - Types won't update otherwise
6. **Global guards apply to all routes** - Use `@Public()` to opt-out
7. **Session Pooler required for IPv4** - Direct connection won't work

---

## 🔗 Useful Commands Reference

```bash
# Quick health check
cd apps/backend && npx prisma db push && cd ../.. && pnpm dev

# Full reset
cd apps/backend && npx prisma migrate reset && cd ../.. && pnpm dev

# Production build
pnpm build && cd apps/backend/dist && node main.js

# Database GUI
cd apps/backend && npx prisma studio

# TypeScript check without running
cd apps/backend && npx tsc --noEmit
```

---

**Last Updated**: 2025-10-15
**Project Version**: 1.0.0
**NestJS Version**: 10.4.20
**Prisma Version**: 5.22.0
