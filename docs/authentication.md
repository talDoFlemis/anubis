# Authentication

## Overview

Anubis uses session-based authentication for the active runtime contract.

- Session auth is the primary mechanism, backed by `connect.sid` and the server-side session store.
- JWT hashes are limited to email confirmation, attached-email confirmation, and password reset flows.
- Auth routes are split between shared session endpoints under `/auth` and provider-specific endpoints under `/auth/provider/...`.
- Error responses are message-oriented. Clients should rely on the top-level `message` field.

## Operational Surface

### `/auth`

Shared authenticated session endpoints live under `/auth`:

- `GET /auth/me`
- `PATCH /auth/me`
- `DELETE /auth/me`
- `POST /auth/logout`
- `POST /auth/onboarding/candidate`

### `/auth/provider/email/*`

Email-provider flows are grouped under `/auth/provider/email`:

- `POST /auth/provider/email/login`
- `POST /auth/provider/email/register`
- `POST /auth/provider/email/link`
- `POST /auth/provider/email/confirm`
- `POST /auth/provider/email/confirm/new`
- `POST /auth/provider/email/forgot/password`
- `POST /auth/provider/email/reset/password`

### `/auth/provider/google/*`

Google-provider flows are grouped under `/auth/provider/google`:

- `POST /auth/provider/google/login`
- `POST /auth/provider/google/link`

### `/system`

The `/system` surface is operational, not part of the user auth flow. It still exists for protected runtime operations, currently `POST /system/change-log-level`, and is guarded by `x-system-token`.

## Data Model

### `users`

`users.email` is the primary account email.

- It identifies the main email attached to the user record.
- It can be `null` for accounts that do not yet have a primary email on the user row.
- Lifecycle flags such as `onboardingCompleted`, `mustChangePassword`, `status`, and token version counters also live on `users`.

### `accounts`

`accounts` stores two distinct auth-related entry types:

- `provider_link`, for enabled login providers such as `email` and `google`
- `attached_email`, for additional owned emails associated with the same user

For attached emails, ownership metadata is stored on the `accounts` row, including normalized email value, verification timestamp, and its own verification token version.

In practice, the effective email model is:

- one primary email on `users.email`
- zero or more additional owned emails backed by `accounts`

## Login And Registration

### Candidate email registration

`POST /auth/provider/email/register` creates a candidate account and sends an email confirmation message.

The registration flow:

1. creates the user record
2. links the `email` provider in `accounts`
3. creates the candidate profile
4. sends the confirmation hash

### Email login

`POST /auth/provider/email/login` validates email and password, regenerates the session ID, and writes a fresh session snapshot used by the guards.

### Google login

`POST /auth/provider/google/login` validates the Google ID token, resolves or creates the user according to provider-link rules, regenerates the session, and starts a logged-in session.

Auto-linking by matching email is not performed. Provider collisions are resolved explicitly through the linked-provider contract.

## Provider Linking

Provider linking is explicit and session-authenticated.

### Link email provider

`POST /auth/provider/email/link` links the email provider to the current authenticated user.

- It requires an authenticated session.
- It is allowed during onboarding-restricted sessions.
- It uses stronger proof from the currently authenticated provider flow before attaching email/password access.
- It can target the primary email or an owned attached email, depending on the request payload.

### Link Google provider

`POST /auth/provider/google/link` links Google to the current authenticated user.

- It requires an authenticated session.
- It verifies the Google token and ownership before linking.
- It fails if the Google identity or provider email already belongs to another user.

## Professor Invites

Professors remain invite-only through `POST /v1/professors/invite`.

This route is guarded by session auth, the session lifecycle guard, and role checks. Only users with the `mdcc-secretary` or `post-graduate-coordinator` role can invite professors.

The invite flow creates a professor account with bootstrap credentials, marks the user as requiring a password change, and sends the invite email.

## Session Snapshot Lifecycle

The active session stores a lightweight user snapshot that includes at least:

- `userId`
- role
- status
- `onboardingCompleted`
- `mustChangePassword`

That snapshot is written when login succeeds and is used by the auth guards on later requests.

At a high level, session lifecycle behavior is:

- missing session snapshot data means the request is unauthenticated
- `mustChangePassword` sessions are restricted to the required password-change-safe surface
- `onboardingCompleted: false` sessions are restricted to onboarding-safe routes
- snapshot-affecting account changes can refresh the current session snapshot or revoke sessions, depending on what changed
- destructive lifecycle changes, such as role or inactive-status transitions, can revoke all sessions

## Error Contract

HTTP error responses are documented and consumed as message-only payloads.

- The backend exception filter returns a top-level `message` value.
- That `message` may be a string or an array of strings.
- Clients should not depend on structured field-level error payloads from auth endpoints.

## Auth Response Shapes

Successful login responses return:

```typescript
{
  userId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
  status: string;
  linkedProviders: string[];
  onboardingCompleted: boolean;
  mustChangePassword: boolean;
}
```

Authenticated user reads return the user profile plus owned email information:

```typescript
{
  id: string;
  email: string | null;
  ownedEmails?: Array<{
    accountId: string | null;
    email: string;
    isPrimary: boolean;
    verifiedAt?: string | null;
  }>;
  // other profile fields omitted
}
```
