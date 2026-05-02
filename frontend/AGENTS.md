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

## Code Style

### Imports

- Use `@/` alias for `src/` path.
- Group: (1) React/external, (2) types, (3) local modules.
- ALWAYS use `import type` for type-only imports.

### TypeScript

- `strict: true` is enabled.
- Avoid `any`. Use specific types or `unknown`.
- Explicit return types for hooks and shared utilities.

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
