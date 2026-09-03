# AI Relationship Platform

Foundation for a multi-tenant relationship platform.

## Status

Phase 0 — Bootstrap foundation.

This phase establishes the application, infrastructure boundaries, observability, CI, database/Redis foundations, and deployment architecture. Business features are intentionally not implemented yet.

## Stack

- Next.js / React / TypeScript
- PostgreSQL
- Prisma
- Redis / BullMQ
- GitHub Actions
- Railway

## Services

- **WEB** — HTTP application and health/readiness endpoints.
- **WORKER** — background-process foundation; no business jobs in Phase 0.
- **PostgreSQL** — system of record.
- **Redis** — queue/runtime infrastructure.

## Local setup

Requirements: Node.js, the selected package manager, PostgreSQL and Redis.

Copy `.env.example` to `.env` and provide local infrastructure values.

Typical commands:

```bash
pnpm install
pnpm prisma migrate dev
pnpm dev
pnpm worker
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm harness
```

## Architecture

See `docs/architecture/overview.md` and `docs/architecture/context.md`.

## Git workflow

`master` is the stable branch. After bootstrap, feature work uses `phase/*` branches and pull requests.

## Environment

Secrets are never committed. Railway supplies production environment variables. Future integrations such as OpenAI and Evolution API remain optional until their respective phases.
