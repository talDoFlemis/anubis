# AGENTS Guide

This file is for coding agents working in this NestJS backend repository.

## About the Project

**Anubis** is an application and selection system for MDCC (Mestrado e Doutorado em Ciência da Computação) - a graduate program in Computer Science. The system handles candidate registration, document submission, and the selection process for master's and doctoral programs.

## Directory Structure

```
anubis/
├── src/                  # Backend source (NestJS modules)
│   ├── auth/             # Core auth guards, decorators
│   ├── auth-email/       # Email/password authentication
│   ├── auth-google/      # Google OAuth
│   ├── auth-github/      # GitHub OAuth
│   ├── users/            # User management + repository pattern
│   ├── candidate/        # Candidate-specific features
│   ├── session/          # Session management
│   ├── mail/             # Email service
│   ├── database/         # Drizzle ORM setup, schema, testing
│   └── common/           # Filters, validators, middlewares
├── test/                 # E2E tests
├── drizzle/              # SQL migration files
├── scripts/              # Utility scripts
└── frontend/             # Frontend application (separate codebase)
```

## Project Snapshot

- **Stack**: NestJS 11 + TypeScript + PostgreSQL + Drizzle ORM
- **Auth**: Session-based with Passport (local, Google strategies)
- **Tests**: Jest unit, integration (Testcontainers), e2e
- **Package Manager**: pnpm

## Agent Rule Sources

- No `.cursor/rules/`, `.cursorrules`, or `.github/copilot-instructions.md` found

## Core Commands

```bash
# Install & Start
pnpm install
pnpm run start:dev          # Development with watch

# Build & Typecheck
pnpm run build              # nest build
npx tsc -p tsconfig.build.json --noEmit --pretty false  # Backend-only typecheck

# Lint & Format
pnpm run lint               # ESLint with autofix
pnpm run lint:check         # ESLint without fix
pnpm run format             # Prettier with write
pnpm run format:check       # Prettier check only

# Tests
pnpm test                   # Unit tests
pnpm run test:cov           # Unit with coverage
pnpm run test:e2e           # E2E tests
pnpm run test:integration   # Integration tests (Testcontainers)

# Database
pnpm run db:generate        # Generate migrations
pnpm run db:migrate         # Run migrations
pnpm run db:studio          # Drizzle Studio
```

## Running Single Tests

```bash
# Unit test file
npx jest src/auth/auth.service.spec.ts --runInBand

# Unit test by name
npx jest src/auth/auth.service.spec.ts -t "test description" --runInBand

# Integration test file
npx jest --config jest.integration.config.ts src/users/infrastructure/persistence/drizzle/user.drizzle-repository.integration-spec.ts

# E2E test file
npx jest --config ./test/jest-e2e.json test/<file>.e2e-spec.ts --runInBand
```

## Validation Workflow

When changing backend code:

```bash
npx tsc -p tsconfig.build.json --noEmit --pretty false  # Typecheck
pnpm run lint:check                                      # Lint
npx jest <changed-specs> --runInBand                     # Run affected tests
```

For schema/repository changes, also run relevant integration tests.

## Architecture (Critical)

- **Feature modules** over horizontal layers - enables 3-5x faster onboarding
- **Thin controllers** - business logic in services, orchestration in controllers
- **Repository pattern** - persistence in `infrastructure/persistence/`
- **Single responsibility** - avoid "god services" with multiple concerns
- **Avoid circular dependencies** - extract shared logic or use events
- **Module exports** - encapsulate services in modules, export explicitly

## Code Style

### Imports

- ES module `import` syntax
- Group: (1) Nest/external, (2) type imports, (3) local modules
- Use `import type` for type-only imports
- Prefer relative imports inside `src/`

### Formatting

- Prettier enforced via ESLint
- Single quotes, trailing commas
- 2-space indentation

### TypeScript

- `strictNullChecks: true` - handle nullable values explicitly
- `noImplicitAny: false` - but avoid introducing new `any`
- Prefer explicit return types for public methods
- Use `Record<string, unknown>` over `any` for flexible objects

### Naming

- Classes: `PascalCase`
- Services/Guards: suffix with role (`AuthService`, `SessionAuthGuard`)
- DTOs: `PascalCase` ending in `Dto`
- Methods/variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Tests: present tense, behavior-focused (`it('rejects invalid token', ...)`)

## NestJS Conventions

- **Constructor injection** with `private readonly` - never property injection
- **Guards** for auth instead of manual checks in controllers
- **DTOs** with `class-validator` decorators for all input validation
- **Explicit module** provider lists - avoid `@Global()` except for config/logging
- **Provider scopes** - use singleton (default) unless request context needed

## Error Handling

- **Throw HTTP exceptions** from services: `BadRequestException`, `ConflictException`, `UnauthorizedException`, `NotFoundException`, `UnprocessableEntityException`
- **Use exception filters** for centralized error handling
- **Handle async errors** - catch fire-and-forget promises, wrap event handlers
- Keep error messages in **Portuguese** (existing convention)
- Log operational failures via `nestjs-pino`
- Non-enumerating flows (forgot-password) don't reveal user existence

## Auth & Security

- Normalize emails: `.toLowerCase().trim()`
- Regenerate session after login/auth changes
- Reject cross-provider login attempts
- Password hashing: bcrypt with 12 salt rounds
- Session revocation on role/status/password changes
- Validate all input with DTOs and pipes

## Persistence

- Update Drizzle schema and SQL migrations together
- Schema changes require: repository updates, integration tests, test helpers
- Make repository contracts explicit
- Use transactions for multi-step operations

## Testing

- **Unit**: `src/**/*.spec.ts` - use `Test.createTestingModule()`
- **Integration**: `src/**/*.integration-spec.ts` (Testcontainers)
- **E2E**: `test/**/*.e2e-spec.ts` - use supertest
- Mock external services in tests
- Test auth flows for both success and provider-conflict paths

## Frontend

When creating or modifying frontend screens or components:

- **Always reference `DESIGN.md`** for design system guidelines
- Follow the "Alexandria" design language: high-end editorial with serif authority
- Use the defined color palette, typography hierarchy, and component patterns
- Apply the "No-Line Rule" - define boundaries through surface color shifts, not borders
- Maintain whitespace as structure and one primary action per view

## Agent Tips

- Use `tsconfig.build.json` for typecheck to exclude frontend
- Check `package.json`, `eslint.config.mjs` before assuming behavior
- Preserve Portuguese user-facing messages
- Don't reintroduce removed multi-provider linking
