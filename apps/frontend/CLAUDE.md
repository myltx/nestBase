# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SoybeanAdmin is a Vue3 admin template built with Vite7, TypeScript, NaiveUI, and UnoCSS. It uses a pnpm monorepo architecture with multiple workspace packages and implements an automated file-based routing system via @elegant-router/vue.

## Development Commands

### Core Commands
- `pnpm dev` - Start development server (runs on port 9527)
- `pnpm build` - Build for production (prod mode)
- `pnpm build:test` - Build for test environment
- `pnpm typecheck` - Run TypeScript type checking without emitting files
- `pnpm lint` - Run ESLint with auto-fix
- `pnpm preview` - Preview production build (port 9725)

### Code Quality & Git
- `pnpm commit` - Interactive commit helper (English, follows Conventional Commits)
- `pnpm commit:zh` - Interactive commit helper (Chinese)
- Pre-commit hook runs: typecheck, lint, and checks for uncommitted changes

### Utility Commands
- `pnpm gen-route` - Generate route files using @sa/scripts
- `pnpm cleanup` - Clean up project files
- `pnpm update-pkg` - Update package dependencies

## Architecture & Structure

### Monorepo Structure
The project uses pnpm workspace with packages in `/packages`:
- `@sa/axios` - Axios wrapper with custom request/response handling
- `@sa/hooks` - Reusable Vue composition hooks
- `@sa/utils` - Shared utility functions
- `@sa/color` - Color utilities for theming
- `@sa/materials` - Shared UI components and materials
- `@sa/scripts` - Build scripts and CLI tools (gen-route, cleanup, etc.)
- `@sa/uno-preset` - UnoCSS preset configuration

### Source Directory Layout
- `src/router/` - Router configuration using @elegant-router/vue
  - `routes/` - Auto-generated and custom route definitions
  - `guard/` - Route guards (progress, title, authentication)
  - `elegant/` - Generated files from elegant-router (imports, transforms)
- `src/store/` - Pinia stores for state management
- `src/service/` - API services and request handling
  - `api/` - API endpoint definitions (auth, route, system-manage, user)
  - `request/` - Axios instance configuration and interceptors
- `src/views/` - Page components
  - `_builtin/` - Built-in pages (404, 403, 500, login, etc.)
  - Feature-based subdirectories (home, manage, etc.)
- `src/layouts/` - Layout components (base-layout, blank-layout)
- `src/components/` - Reusable components
  - `advanced/` - Complex components
  - `common/` - Common shared components
  - `custom/` - Project-specific custom components
- `src/locales/` - i18n internationalization files
- `src/theme/` - Theme configuration
- `src/hooks/` - Vue composition API hooks
- `src/utils/` - Utility functions
- `src/typings/` - TypeScript type definitions

### Routing System
This project uses **@elegant-router/vue** for automatic route generation:
- Routes are auto-generated from the file structure in `src/views/`
- Generated route files are in `src/router/elegant/`
- Supports both **static** and **dynamic** (backend) route modes
- Route metadata controls whether routes are constant (public) or require auth
- Custom routes can be added in `src/router/routes/index.ts`
- Use `pnpm gen-route` to regenerate routes after adding/modifying view files

### API Request Architecture
- Uses a custom axios wrapper from `@sa/axios` package
- Base configuration in `src/service/request/index.ts`
- Implements `createFlatRequest` for simplified response handling
- Request interceptor adds authorization headers automatically
- Response interceptor handles backend error codes and token expiration
- Backend success is determined by comparing response code with `VITE_SERVICE_SUCCESS_CODE`
- API service modules in `src/service/api/` (auth, route, system-manage, user)

### State Management
- Uses Pinia for state management
- Store setup includes custom `resetSetupStore` plugin
- Modular store structure in `src/store/modules/`

### Environment Configuration
- Multiple environment files: `.env`, `.env.local`, `.env.test`, `.env.prod`
- Environment variables prefixed with `VITE_`
- Key variables: `VITE_BASE_URL`, `VITE_SERVICE_SUCCESS_CODE`, `VITE_HTTP_PROXY`
- Service base URLs configured via `getServiceBaseURL()` utility

### Build Configuration
- Vite config at `vite.config.ts`
- Path aliases: `@` → `src/`, `~` → project root
- SCSS global styles auto-imported via preprocessorOptions
- Plugins configured in `build/plugins/`
- Proxy configuration in `build/config/proxy.ts`

### Code Standards
- Follows SoybeanJS code standards
- ESLint config from `@soybeanjs/eslint-config`
- Supports strict TypeScript checking
- Uses simple-git-hooks for pre-commit validation

## Important Development Notes

### When Adding New Pages
1. Create view component in appropriate `src/views/` subdirectory
2. Run `pnpm gen-route` to regenerate routing files
3. Route metadata determines if page requires authentication

### When Working with APIs
- API definitions go in `src/service/api/`
- Use the shared `request` instance from `src/service/request/`
- Backend responses must match the `App.Service.Response` type
- Authorization is automatically added to request headers

### Styling
- Uses UnoCSS with custom preset from `@sa/uno-preset`
- Global SCSS variables available via `@/styles/scss/global.scss`
- Supports NaiveUI component library theming

### Type Safety
- Always run `pnpm typecheck` before committing
- API types in `src/typings/api/`
- Generated route types are auto-created by elegant-router

## Requirements
- Node.js >= 20.19.0
- pnpm >= 10.5.0
- **Always use pnpm** (never npm or yarn) due to monorepo structure
