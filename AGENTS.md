# AGENTS.md

This file contains high-signal, repo-specific context for AI agents working in this repository.

## Overview & Toolchain
- **Stack**: NestJS v11, Prisma 7, PostgreSQL, Passport JWT.
- **Package Manager**: `npm` (`package-lock.json` is the source of truth).
- **TypeScript**: Strict mode is enabled. Use `npm run build` and `npm run typecheck` / `npm run lint` for verification.

## Architecture & Conventions
- **Environment Configuration**: Environment variables are strictly validated using `zod` in `src/config/envs.ts`. **Do not** use `process.env` throughout the application code. Instead, import the parsed `envs` object from `src/config/envs.ts`.
- **Global Validation**: `ValidationPipe` is enabled globally with `whitelist: true` and `forbidNonWhitelisted: true`. You must heavily decorate DTOs with `class-validator` (and `class-transformer` if needed); otherwise, the payload will be stripped or rejected.
- **Global Prefix**: The API uses a global prefix `api/v1`.
- **Swagger**: OpenAPI documentation is initialized and served at `/api/docs`.

## Prisma 7 Quirks
- **Schema & Configuration**: This project uses **Prisma 7**'s native configuration file `prisma.config.ts`. The database `url` is configured there, **not** in the `datasource` block of `prisma/schema.prisma`. Do not attempt to modify the `url` via `schema.prisma`.
- **Database Driver Adapter**: The project uses the Prisma driver adapter for Postgres (`@prisma/adapter-pg`). The native `pg` pool connection logic is manually initialized and injected into Prisma inside `src/providers/prisma/prisma.service.ts`. Edit this file if modifying connection pool behaviors.

## Testing & Verification
- **Unit tests**: Kept alongside the source files as `*.spec.ts`. Run with `npm run test` or `npm run test:watch`.
- **E2E tests**: Kept in the `test/` directory as `*.e2e-spec.ts`. Run with `npm run test:e2e`. The configuration for these tests lives in `test/jest-e2e.json`.
