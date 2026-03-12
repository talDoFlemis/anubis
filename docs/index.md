# Anubis

Anubis is a backend API built with [NestJS](https://nestjs.com/) and TypeScript. It provides a complete authentication system with session-based security, email/password registration, and Google OAuth integration.

## Tech Stack

| Component        | Technology                                                     |
| ---------------- | -------------------------------------------------------------- |
| Framework        | NestJS (Express)                                               |
| Language         | TypeScript                                                     |
| Database         | PostgreSQL                                                     |
| ORM              | Drizzle ORM                                                    |
| Auth             | Server-side sessions (`express-session` + `connect-pg-simple`) |
| Password Hashing | bcrypt (12 salt rounds)                                        |
| OAuth            | Google Auth Library                                            |
| Email            | Nodemailer                                                     |
| API Docs         | Swagger / Scalar                                               |
| Container        | Docker                                                         |
| CI/CD            | GitHub Actions + Semantic Release                              |

## Documentation

- [Authentication](authentication.md) -- Architecture, flows, API endpoints, and configuration for the auth system.
