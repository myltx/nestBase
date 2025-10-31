# Repository Guidelines

## Project Structure & Module Organization
- `src/` — application source. Entry: `src/main.ts`; root module: `src/app.module.ts`.
- Features live under `src/modules/<feature>/` with `*.module.ts`, `*.controller.ts`, `*.service.ts`, `dto/*.dto.ts`, `entities/*.entity.ts`.
- Shared utilities in `src/common/` (filters, guards, interceptors, pipes).
- `test/` — unit tests `*.spec.ts`, end‑to‑end tests `*.e2e-spec.ts`.
- Config: `nest-cli.json`, `tsconfig*.json`. Build output: `dist/`.

## Build, Test, and Development Commands
- `npm run start:dev` — start in watch mode (hot reload).
- `npm run build` — compile TypeScript to `dist/`.
- `npm run start:prod` — run the compiled app from `dist/`.
- `npm run test` / `test:watch` / `test:cov` / `test:e2e` — Jest suites.
- `npm run lint` / `npm run format` — ESLint and Prettier.
Note: Use your package manager alias (`npm` | `pnpm` | `yarn`).

## Coding Style & Naming Conventions
- TypeScript, ESLint + Prettier; 2‑space indent; single quotes; semicolons; trailing commas where practical.
- Classes/Modules/Controllers/Services in PascalCase; variables/functions in camelCase.
- File names in kebab-case with Nest suffixes: `user.controller.ts`, `user.service.ts`, `user.module.ts`; DTOs `*.dto.ts`; entities `*.entity.ts`.

## Testing Guidelines
- Prefer unit tests per provider; mock external dependencies.
- Use `@nestjs/testing` `TestingModule` to compose units.
- Place fixtures under `test/` or `__mocks__/` when helpful.
- Keep `npm run test:cov` green before opening PRs.

## Commit & Pull Request Guidelines
- Conventional Commits: `feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`.
  Example: `feat(user): add password reset via token`.
- One logical change per PR. Include description, steps to verify, and `Closes #123` when applicable.
- Add screenshots/logs for behavioral changes and update docs and `.env.example` if config changes.

## Security & Configuration Tips
- Never commit secrets; keep them in `.env` and update `env.example` for new keys.
- Prefer `ConfigModule` and validate env with `Joi`.
- Enable CORS and Helmet; validate DTOs with `class-validator`/`class-transformer`.

