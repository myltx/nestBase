# Repository Guidelines

Concise practices for contributing to this admin web app. Prefer clarity, small PRs, and scripts defined in `package.json` as the source of truth.

## Project Structure & Module Organization
- `src/`: application code by feature (e.g., `src/pages`, `src/components`, `src/features`, `src/lib`).
- `public/`: static assets served as‑is.
- `tests/` or `src/__tests__/`: unit/integration tests; mirror `src` layout.
- `scripts/`: local/CI helpers. `.github/workflows/`: CI pipelines.
- Key configs live alongside the stack (e.g., `vite.config.*`/`next.config.*`).

## Build, Test, and Development Commands
- `npm ci` — install exact deps (use `yarn install --frozen-lockfile`/`pnpm i --frozen-lockfile` if preferred).
- `npm run dev` — start local dev server with HMR.
- `npm run build` — production build to `dist/`.
- `npm run preview` — serve the built app locally.
- `npm run test` / `npm run test:watch` — run tests once / in watch mode.
- `npm run lint` / `npm run format` — lint and format with project rules.

## Coding Style & Naming Conventions
- Indentation: 2 spaces; keep imports sorted; prefer trailing commas; consistent semicolons.
- TypeScript where present; prefer strict types and explicit return types on exports.
- Files/dirs: `kebab-case`. Components: `PascalCase` (e.g., `UserTable.tsx`/`UserTable.vue`).
- Identifiers: `camelCase`; constants: `UPPER_SNAKE_CASE`.
- Tools: ESLint + Prettier (see `.eslintrc*`, `.prettierrc*`, `.editorconfig`).

## Testing Guidelines
- Framework: Vitest/Jest with Testing Library (see `devDependencies`).
- Place tests near code as `*.test.ts[x]` or under `tests/` mirroring `src`.
- Aim for ≥80% coverage on changed lines; include error paths and accessibility.
- Run `npm run test` locally and in CI; fix flaky tests before merging.

## Commit & Pull Request Guidelines
- Conventional Commits: `feat|fix|docs|chore|refactor|test|build(scope): summary`.
  - Example: `feat(table): add sortable columns`.
- PRs: clear description, linked issues (`#123`), screenshots for UI changes, notes on breaking changes.
- Keep PRs focused (prefer < ~300 changed lines); update tests/docs.

## Security & Configuration Tips
- Do not commit secrets. Use `.env.local`; document required keys. Commit the lockfile.
- Public env prefixes: `VITE_`/`NEXT_PUBLIC_` as applicable.
- Review dependency diffs in PRs; prefer pinned versions for critical deps.

