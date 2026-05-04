# TienThu API

Backend REST API for the TienThu application, built with NestJS + TypeScript + Prisma.

## Tech Stack

| Layer      | Technology                                |
| ---------- | ----------------------------------------- |
| Framework  | NestJS 11, TypeScript 5                   |
| ORM        | Prisma 6 (PostgreSQL / Supabase)          |
| Auth       | JWT (access + refresh tokens), bcrypt     |
| Validation | Zod via nestjs-zod                        |
| Security   | Helmet, rate limiting (@nestjs/throttler) |
| API Docs   | Swagger / OpenAPI                         |

## Prerequisites

- Node.js ≥ 20
- PostgreSQL database (Supabase recommended)

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env — set DATABASE_URL, DIRECT_URL, JWT_SECRET, JWT_REFRESH_SECRET

# 3. Run database migrations
npm run prisma:migrate:dev
```

## Running

```bash
# Development (watch mode)
npm run start:dev

# Production
npm run build
npm run start:prod
```

The server starts at `http://localhost:8181/api/v1` by default.

Swagger UI is available at `http://localhost:8181/docs` (when `SWAGGER_ENABLED=true`).

## API Endpoints

All routes are prefixed with `/api/v1`.

| Method | Path                | Auth   | Description                            |
| ------ | ------------------- | ------ | -------------------------------------- |
| POST   | /auth/register      | Public | Register a new account                 |
| POST   | /auth/login         | Public | Login, receive access + refresh tokens |
| POST   | /auth/refresh-token | Public | Rotate access + refresh token pair     |
| POST   | /auth/logout        | Bearer | Revoke refresh token                   |
| GET    | /auth/me            | Bearer | Get current user                       |
| GET    | /health             | Public | Health check                           |

## Environment Variables

| Variable                 | Default | Description                        |
| ------------------------ | ------- | ---------------------------------- |
| `PORT`                   | `8181`  | HTTP port                          |
| `API_PREFIX`             | `api`   | URL prefix                         |
| `CORS_ORIGINS`           | `*`     | Allowed origins (comma-separated)  |
| `DATABASE_URL`           | —       | Pooled Prisma connection string    |
| `DIRECT_URL`             | —       | Direct connection (for migrations) |
| `SWAGGER_ENABLED`        | `true`  | Enable Swagger UI                  |
| `SWAGGER_PATH`           | `docs`  | Swagger UI path                    |
| `THROTTLE_TTL`           | `60000` | Rate limit window in ms            |
| `THROTTLE_LIMIT`         | `100`   | Max requests per window per IP     |
| `JWT_SECRET`             | —       | Access token secret (≥ 32 chars)   |
| `JWT_EXPIRES_IN`         | `15m`   | Access token TTL                   |
| `JWT_REFRESH_SECRET`     | —       | Refresh token secret (≥ 32 chars)  |
| `JWT_REFRESH_EXPIRES_IN` | `7d`    | Refresh token TTL                  |
| `BCRYPT_SALT_ROUNDS`     | `10`    | bcrypt cost factor                 |

## Scripts

```bash
npm run build                   # Compile TypeScript
npm run start:dev               # Dev server with hot reload
npm run lint:check              # ESLint check
npm run lint:fix                # ESLint auto-fix
npm run format:check            # Prettier check
npm run format:fix              # Prettier auto-fix
npm run type-check              # TypeScript type check (no emit)
npm run test                    # Unit tests
npm run test:cov                # Unit tests with coverage
npm run test:e2e                # End-to-end tests
npm run prisma:migrate:dev      # Run migrations (dev)
npm run prisma:migrate:deploy   # Run migrations (production)
npm run prisma:studio           # Open Prisma Studio
```
