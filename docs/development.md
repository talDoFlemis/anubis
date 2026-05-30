# Local Development Guide

## Prerequisites

- Node.js 22+
- pnpm
- Docker + Docker Compose

---

## Setup

### 1. Clone and install dependencies

```bash
# Backend
pnpm install

# Frontend
cd frontend && pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
```

The defaults in both files work out of the box for local dev. No changes needed unless you need Google OAuth (see [Google OAuth](#google-oauth)).

### 3. Start infrastructure

Spin up only PostgreSQL and Mailpit — API and frontend run locally.

```bash
docker compose up postgres mailpit -d
```

### 4. Run migrations

```bash
pnpm run db:migrate
```

### 5. Seed the database

Run in this order:

```bash
pnpm run db:seed:themes   # default role-based users + research themes
pnpm run db:seed          # 14 bulk professor records (for pagination/list testing)
```

### 6. Start the API

```bash
pnpm run start:dev
```

API runs at `http://localhost:3000`. Swagger UI at `http://localhost:3000/api`.

### 7. Start the frontend

```bash
cd frontend && pnpm run dev
```

Frontend runs at `http://localhost:5173`.

---

## Default Seed Users

All accounts use password **`senha123`**.

| Email | Role | Notes |
|---|---|---|
| `candidate@anubis.com` | Candidate | |
| `professor@anubis.com` | Professor | Has research themes |
| `secretary@anubis.com` | MDCC Secretary | |
| `coordinator@anubis.com` | Post-Graduate Coordinator | |
| `vice@anubis.com` | Post-Graduate Vice-Coordinator | |

The bulk professor seed (`db:seed`) creates 14 additional professor accounts (`r.almeida@ufc.br`, `ana.souza@mdcc.ufc.br`, etc.) also with password `senha123`, but with `mustChangePassword: true` — they are redirected to change password on first login.

---

## Email (Mailpit)

Mailpit catches all outgoing email locally. Access the inbox at **`http://localhost:8025`**.

Flows that require it:
- **Forgot password** — reset link is sent via email; click it from Mailpit to complete the flow.
- **Email confirmation** — confirmation link is sent on registration.

---

## Google OAuth

Leave `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` blank in `.env` to skip Google OAuth. All seed users support email/password login.

---

## Testing

| Command | Suite | Notes |
|---|---|---|
| `pnpm test` | Unit | No external deps |
| `pnpm run test:integration` | Integration | Requires Docker daemon (Testcontainers) |
| `pnpm run test:e2e` | E2E | Requires running API |
| `pnpm run test:cov` | Unit + coverage | — |

Run a single file:

```bash
# Unit
npx jest src/auth/auth.service.spec.ts --runInBand

# Integration
npx jest --config jest.integration.config.ts src/users/infrastructure/persistence/drizzle/user.drizzle-repository.integration-spec.ts

# E2E
npx jest --config ./test/jest-e2e.json test/<file>.e2e-spec.ts --runInBand
```

---

## Validation Before Committing

```bash
npx tsc -p tsconfig.build.json --noEmit --pretty false   # typecheck
pnpm run lint:check                                       # lint
npx jest <changed-specs> --runInBand                      # affected tests
```

---

## Useful URLs

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| API | http://localhost:3000/api |
| Swagger | http://localhost:3000/api |
| Mailpit | http://localhost:8025 |
| Drizzle Studio | `pnpm run db:studio` |
