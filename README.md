# Anubis

Selection management system for MDCC (Masters and Doctors) postgraduate programs. Handles the end-to-end candidate selection workflow including user registration, authentication, role-based access, and session management.

## Tech Stack

### Backend

- **Runtime:** Node.js with TypeScript
- **Framework:** NestJS 11 (Express)
- **Database:** PostgreSQL with Drizzle ORM
- **Auth:** Session-based (`express-session` + `connect-pg-simple`), Google OAuth, JWT for email confirmation/password reset tokens
- **Email:** Nodemailer (SMTP and Google OAuth transports)
- **Validation:** class-validator + class-transformer
- **API Docs:** Swagger + Scalar UI (available at `/reference`)
- **Logging:** Winston via nest-winston
- **Health Checks:** @nestjs/terminus

### Frontend

- **Framework:** React 19 with TypeScript
- **Build Tool:** Vite 8
- **Routing:** TanStack Router (file-based)
- **Server State:** TanStack React Query
- **UI:** Radix UI primitives + Tailwind CSS 4 (shadcn/ui pattern)
- **Icons:** Lucide React
- **Auth:** @react-oauth/google

### Infrastructure

- **Containerization:** Multi-stage Docker builds using Chainguard hardened images
- **Orchestration:** Docker Compose (PostgreSQL, API, Frontend, Mailpit)
- **CI/CD:** GitHub Actions (lint, format, build, test, semantic-release, GHCR publishing)
- **Documentation:** MkDocs Material, deployed to GitHub Pages
- **Registry:** GitHub Container Registry (GHCR)

### Testing

- **Unit/E2E:** Jest 30 + ts-jest + Supertest
- **Integration:** Testcontainers (PostgreSQL)

## Roles

| Role                        | Description                       |
| --------------------------- | --------------------------------- |
| `candidate`                 | Applicant to the program          |
| `professor`                 | Faculty member                    |
| `mdcc-secretary`            | MDCC committee secretary          |
| `post-graduate-coordinator` | Post-graduate program coordinator |

## Project Setup

```bash
pnpm install
```

## Running

```bash
# development
pnpm run start:dev

# production
pnpm run start:prod

# with docker compose
docker compose up
```

## Tests

```bash
# unit tests
pnpm test

# integration tests
pnpm test:integration

# e2e tests
pnpm test:e2e
```

## Database Migrations

```bash
# generate a migration
pnpm drizzle-kit generate

# apply migrations
pnpm drizzle-kit migrate
```
