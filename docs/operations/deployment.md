# Deployment Operations

## Services

WEB runs `pnpm start` and uses `/health` for liveness. WORKER runs `pnpm worker` and remains alive while waiting for jobs.

## Migrations

The WEB service owns the controlled migration step: `pnpm prisma migrate deploy` runs as its Railway pre-deploy command. The WORKER never migrates, preventing concurrent schema changes.

## Railway

Railway is the deployment target. PostgreSQL and Redis are managed services. `APP_URL` uses the Railway-provided domain initially; a definitive custom domain is deferred. Both services use the committed lockfile, Node 22 and Railpack.

## Required Phase 0 variables

`NODE_ENV`, `DATABASE_URL`, `REDIS_URL`, `APP_URL`.

Future provider secrets remain optional until their implementation phases. Each release requires terminal Railway deployment status `SUCCESS`, `/health` and `/ready` returning 200, healthy worker startup logs and `prisma migrate status` from the WEB service environment.

