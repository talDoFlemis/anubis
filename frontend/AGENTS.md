# Anubis Frontend Agent Guide

This file is for coding agents working in this React/Vite frontend repository.

## About the Project

**Anubis Frontend** is the user interface for the MDCC application and selection system. It handles candidate onboarding, document submission, and administrative management of the selection process.

## Directory Structure

```
frontend/
├── src/
│   ├── routes/           # File-based routing (TanStack Router)
│   ├── components/       # Reusable UI components
│   │   ├── ui/           # Shadcn/ui primitives
│   │   └── layout/       # Layout-specific components
│   ├── features/         # Feature-specific logic and components
│   ├── hooks/            # Custom React hooks (TanStack Query)
│   ├── lib/              # Core libraries (API client, utils)
│   └── types/            # TypeScript type definitions
├── public/               # Static assets
└── DESIGN.md             # Design system guidelines
```

## Project Snapshot

- **Stack**: React 19 + Vite 6 + TypeScript + Tailwind CSS 4
- **Routing**: TanStack Router (File-based)
- **State**: TanStack Query v5 (Server state) + React State (UI state)
- **Forms**: TanStack Form v1 for route-local and feature-local forms
- **Validation**: Zod for schema validation and cross-field rules
- **UI Components**: Radix UI + Shadcn/ui pattern
- **Package Manager**: pnpm

## Core Commands

```bash
# Install & Start
pnpm install
pnpm run dev                # Development server

# Build & Typecheck
pnpm run build              # Build for production
pnpm run typecheck          # TypeScript typecheck

# Lint & Format
pnpm run lint:check         # ESLint check
pnpm run lint:fix           # ESLint fix
pnpm run format:check       # Prettier check
pnpm run format             # Prettier fix
```

## Architecture (Critical)

- **File-based Routing**: Uses TanStack Router. Do not edit `routeTree.gen.ts` manually.
- **Server State**: Use TanStack Query hooks in `src/hooks/` or `src/features/`.
- **API Client**: Use the typed wrapper in `src/lib/api.ts` (handles sessions/cookies).
- **Layouts**: 
  - `src/routes/__root.tsx`: Main shell.
  - `src/routes/_app.tsx`: Protected routes.
  - `src/routes/auth.tsx`: Auth-specific routes.
- **Component Pattern**: Follow Shadcn/ui style for UI primitives in `src/components/ui/`.
- **Forms Pattern**: Use `useForm` from `@tanstack/react-form` with Zod schemas for validation. Prefer `form.Field` render props and keep form state inside the form component unless multiple views must share the same state.
- **Table Pattern**: Prefer the shared table wrapper in `src/components/table` and TanStack Table column definitions for feature tables. Keep column factories close to the feature using them.

## **File Placement**

- Prefer placing non-page code related to a feature inside `src/features/<feature_name>/`. Typical contents: feature-specific components, hooks, types, api clients, and form schemas.
- Use `src/shared/` for cross-feature utilities, UI primitives, or domain-agnostic helpers that many features consume.
- Keep pure UI primitives in `src/components/` (and `src/components/ui/` for Shadcn/Radix primitives). Feature-specific components may live under the feature's `components/` subfolder.
- Put core libraries and low-level utilities in `src/lib/` (API client, session, formatting helpers).
- Avoid placing non-route files inside `src/routes/`. Route folders should only contain route/page components and files directly required by those pages. If a file in `src/routes/` is not a route, move it to the appropriate `features/`, `shared/`, `components/`, or `lib/` location. Alternatively, to explicitly ignore a file from routing, prefix it with `-` (e.g., `-myfile.ts`) or match it with `routeFileIgnorePattern` in the config.

Example feature layout:

```
src/features/<feature_name>/
  ├── components/    # feature-specific UI
  ├── hooks/         # feature data-fetching hooks
  ├── types/         # feature types and zod schemas
  └── api/           # feature-specific API adapters
```

## Code Style

### Imports

- Use `@/` alias for `src/` path.
- Group: (1) React/external, (2) types, (3) local modules.
- ALWAYS use `import type` for type-only imports.

### TypeScript

- `strict: true` is enabled.
- Avoid `any`. Use specific types or `unknown`.
- Explicit return types for hooks and shared utilities.
- Prefer Zod schemas for input validation instead of custom error maps where feasible.

### Naming

- Components: `PascalCase` (e.g., `SubmitButton.tsx`).
- Hooks: `camelCase` starting with `use` (e.g., `useAuth.ts`).
- Utilities/Variables: `camelCase`.
- Constants: `UPPER_SNAKE_CASE`.

## Design System (Alexandria)

When creating or modifying frontend screens or components:

- **Always reference `DESIGN.md`** in this directory for full guidelines.
- **Alexandria Language**: High-end editorial with serif authority (e.g., `font-serif`).
- **No-Line Rule**: Define boundaries through surface color shifts (e.g., `bg-muted`), not borders.
- **Whitespace**: Maintain generous whitespace as a structural element.
- **Actions**: One primary action per view.

## Error Handling

- Use `ApiError` from `src/lib/api.ts` for handling backend responses.
- User-facing messages should be in **Portuguese** (follow existing convention).
- Use `sonner` for toast notifications.

## Testing

- No test suite configured yet. 
- Prioritize creating verifiable units in `src/lib/` or `src/hooks/`.
- If adding tests, use Vitest to match the Vite ecosystem.

## Agent Tips

- Check `vite.config.ts` and `tailwind.config.js` before assuming styling behavior.
- Use `pnpm run typecheck` frequently to ensure type safety across routes.
- Verify `routeTree.gen.ts` updates after adding/moving files in `src/routes/`.
