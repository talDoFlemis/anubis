# AGENTS Guide

This file is for coding agents working in `/home/flemis/codes/anubis`.

## Project Snapshot

- Backend: NestJS 11 + TypeScript + PostgreSQL + Drizzle ORM
- Auth: session-based auth with Passport strategies
- Tests: Jest unit tests, Jest integration tests with Testcontainers, Jest e2e
- Frontend exists in `frontend/`, but backend repo commands live at the workspace root

## Agent Rule Sources

- No repository-local Cursor rules were found in `.cursor/rules/`
- No `.cursorrules` file was found
- No Copilot instructions were found in `.github/copilot-instructions.md`
- Follow this file plus the existing codebase conventions

## Package Manager

- Use `npm` for commands in this repository because `package.json` scripts are defined for npm
- Do not assume `pnpm` even though `README.md` mentions it

## Core Commands

### Install

```bash
pnpm install
```

### Start the backend

```bash
pnpm run start
pnpm run start:dev
pnpm run start:debug
pnpm run start:prod
```

### Build

```bash
pnpm run build
npx tsc -p tsconfig.build.json --noEmit --pretty false
```

Notes:

- `pnpm run build` runs `nest build`
- `npx tsc -p tsconfig.build.json --noEmit --pretty false` is the safest backend-only typecheck because it excludes `frontend/` and spec files

### Lint and format

```bash
pnpm run lint
pnpm run lint:check
pnpm run format
pnpm run format:check
```

### Tests

```bash
pnpm test
pnpm run test:watch
pnpm run test:cov
pnpm run test:e2e
pnpm run test:integration
```

## Running a Single Test

### Single unit test file

```bash
npx jest src/auth/auth.service.spec.ts --runInBand
```

### Single test file from a script-compatible pattern

```bash
pnpm test -- --runInBand src/auth/auth.service.spec.ts
```

### Single test by name

```bash
npx jest src/auth/auth.service.spec.ts -t "creates onboarding-incomplete candidate on first social signup" --runInBand
```

### Single integration test file

```bash
npx jest --config jest.integration.config.ts src/users/infrastructure/persistence/drizzle/user.drizzle-repository.integration-spec.ts
```

### Single e2e test file

```bash
npx jest --config ./test/jest-e2e.json test/<file>.e2e-spec.ts --runInBand
```

## Database Commands

```bash
pnpm run db:generate
pnpm run db:migrate
pnpm run db:studio
```

## High-Confidence Validation Workflow

When changing backend code, prefer this order:

```bash
npx tsc -p tsconfig.build.json --noEmit --pretty false
pnpm run lint:check
npx jest <changed-specs> --runInBand
```

If schema or repository code changes, also run the relevant integration test.

## Architecture Expectations

- Prefer feature modules over horizontal layers when adding new code
- Keep controllers thin; business logic belongs in services
- Keep persistence logic in repository classes under `src/users/infrastructure/persistence/` or similar feature-specific persistence folders
- Keep DTOs in `dto/` folders and use them at module boundaries
- Reuse shared auth/session helpers instead of duplicating session mutation logic

## Imports

- Use ES module `import` syntax
- Group imports roughly as: (1) Nest / external packages, (2) `type` imports from external packages, (3) local DTOs/services/entities, (4) sibling and parent feature imports
- Use `import type` for type-only imports when practical
- Prefer relative imports inside `src/`; backend code does not consistently use path aliases
- Keep import ordering readable and stable rather than aggressively optimized

## Formatting

- Prettier is enforced through ESLint
- Use 2-space indentation
- Keep trailing commas where Prettier inserts them
- Favor multiline formatting once argument lists or decorators stop being easy to scan
- Do not hand-format against Prettier; run formatter if needed

## TypeScript Rules

- `strictNullChecks` is enabled; handle nullable values explicitly
- `noImplicitAny` is not enabled, but do not introduce new `any` unless unavoidable
- Prefer explicit return types for public service/controller methods
- Use narrow DTO and method parameter types instead of broad records
- Use `Record<string, unknown>` instead of `any` for flexible object payloads
- Prefer union literals and enums already present in the codebase over ad hoc strings

## Naming Conventions

- Classes: `PascalCase`
- Injectable services/controllers/guards/strategies: suffix with role, e.g. `AuthService`, `LocalAuthGuard`, `GoogleIdTokenStrategy`
- DTOs: `PascalCase` ending in `Dto`
- Methods/variables/functions: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Test descriptions: present tense, behavior-focused, e.g. `it('rejects email login for google-backed user', ...)`

## NestJS Conventions

- Use decorators consistently for controllers, DTO validation, and DI
- Prefer constructor injection with `private readonly` fields
- Keep module provider lists explicit
- Use guards for auth entrypoints rather than manual auth checks in controllers
- Put request validation in DTOs with `class-validator`

## Error Handling

- Throw Nest HTTP exceptions (`BadRequestException`, `ConflictException`, `UnauthorizedException`, `NotFoundException`, `UnprocessableEntityException`) instead of generic errors for user-facing failures
- Keep error messages user-oriented and consistent with existing Portuguese copy
- Log operational failures with structured fields via `nestjs-pino`
- Do not swallow exceptions silently unless the flow is intentionally non-enumerating, such as forgot-password
- For token validation, convert verification failures into stable client-facing exceptions

## Validation and Security

- Normalize emails with `.toLowerCase().trim()` before lookup or persistence
- Regenerate the session after successful login or other auth-boundary changes
- Do not trust provider payloads unless validated by the provider service/strategy
- Reject cross-provider login attempts with the existing “use your original provider” behavior
- Keep password hashing with `bcrypt` and existing salt-round constants

## Persistence and Migrations

- Update Drizzle schema files and SQL migrations together
- If you change schema shape, also update repository implementation, repository integration tests, and test database helpers if table names change
- Avoid hidden persistence behavior in services; make repository contracts explicit

## Testing Guidelines

- Unit tests live in `src/**/*.spec.ts`
- Integration tests live in `src/**/*.integration-spec.ts`
- Integration tests rely on `jest.integration.config.ts` and Testcontainers global setup
- Prefer focused unit tests for controller/service behavior and integration tests for repository constraints and migrations
- When changing auth flows, add tests for both success and provider-conflict paths

## Practical Agent Advice

- Check `package.json`, `eslint.config.mjs`, `tsconfig.json`, and `tsconfig.build.json` before assuming tool behavior
- If `pnpm exec tsc --noEmit` accidentally pulls in frontend errors, use `npx tsc -p tsconfig.build.json --noEmit --pretty false` instead
- Do not reintroduce removed multi-provider linking patterns unless explicitly requested
- Preserve existing Portuguese user-facing messages unless the task requires revising them
