# Deployment Operations

## Services

WEB runs `pnpm start` and uses `/health` for liveness. WORKER runs `pnpm worker` and remains alive while waiting for jobs.

## Migrations

Production migrations use `prisma migrate deploy` from one controlled release/migration step. WEB and WORKER must not independently apply production migrations.

## Railway

Railway is the deployment target. PostgreSQL and Redis are managed services. `APP_URL` uses the Railway-provided domain initially; a definitive custom domain is deferred.

## Required Phase 0 variables

`NODE_ENV`, `DATABASE_URL`, `REDIS_URL`, `APP_URL`.

Future provider secrets remain optional until their implementation phases.
