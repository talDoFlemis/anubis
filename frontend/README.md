# Anubis Frontend

Web client for the Anubis selection management system, providing the user interface for authentication, registration, and program management.

## Tech Stack

| Category          | Technology                                                 |
| ----------------- | ---------------------------------------------------------- |
| **Framework**     | React 19                                                   |
| **Language**      | TypeScript 5.9                                             |
| **Build Tool**    | Vite 8                                                     |
| **Routing**       | TanStack Router (file-based)                               |
| **Server State**  | TanStack React Query v5                                    |
| **UI Components** | Radix UI primitives (shadcn/ui pattern)                    |
| **Styling**       | Tailwind CSS 4 + class-variance-authority + tailwind-merge |
| **Icons**         | Lucide React                                               |
| **Toasts**        | Sonner                                                     |
| **Auth**          | @react-oauth/google + session cookies                      |
| **API Client**    | Custom typed fetch wrapper (`src/lib/api.ts`)              |
| **Environment**   | vite-envs (runtime env injection for Docker)               |
| **Linting**       | ESLint                                                     |
| **Formatting**    | Prettier                                                   |

## Project Structure

```
src/
  components/
    ui/             # Reusable UI primitives (button, card, input, avatar, etc.)
    app-sidebar.tsx # Application sidebar layout
    google-login-button.tsx
  hooks/
    use-auth.ts     # Auth hooks (login, register, logout, password reset, etc.)
  lib/
    api.ts          # Typed fetch wrapper with credential handling
    utils.ts        # Shared utilities (cn, etc.)
  pages/            # Page-level components
  routes/           # TanStack Router file-based routes
    __root.tsx      # Root layout
    _app.tsx        # Authenticated layout (redirects to sign-in if unauthenticated)
    _app/
      index.tsx     # Dashboard (authenticated home)
    auth.tsx        # Auth layout (redirects to / if already authenticated)
    auth/
      sign-in.tsx
      sign-up.tsx
      confirm-email.tsx
      confirm-new-email.tsx
      forgot-password.tsx
      reset-password.tsx
  routeTree.gen.ts  # Auto-generated route tree
```

## Setup

```bash
pnpm install
cp .env.example .env
```

## Development

```bash
pnpm dev
```

## Build

```bash
pnpm build
```

## Lint & Format

```bash
pnpm lint
pnpm format:check
```

## Typecheck

```bash
pnpm typecheck
```
