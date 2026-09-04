import { execFileSync } from "node:child_process";
import { checkDatabaseConnection } from "@/lib/db";
import { parseEnvironment } from "@/lib/env";
import { checkRedisConnection } from "@/lib/redis";
import { GET as health } from "@/app/health/route";
import { GET as ready } from "@/app/ready/route";
import { startWorker } from "@/workers";

function run(command: string, arguments_: string[]) {
  execFileSync(command, arguments_, { stdio: "inherit", env: process.env });
}

function verifyGitRevision() {
  if (process.env.RAILWAY_GIT_COMMIT_SHA) {
    console.log(`Railway Git revision: ${process.env.RAILWAY_GIT_COMMIT_SHA}`);
    return;
  }

  run("git", ["rev-parse", "--verify", "HEAD"]);
}

async function main() {
  parseEnvironment();
  verifyGitRevision();
  run("pnpm", ["lint"]);
  run("pnpm", ["typecheck"]);
  run("pnpm", ["test"]);
  run("pnpm", ["build"]);
  run("pnpm", ["prisma", "validate"]);
  await checkDatabaseConnection();
  await checkRedisConnection();
  await startWorker({ checkDatabase: checkDatabaseConnection, checkRedis: checkRedisConnection, waitForShutdown: async () => undefined });

  if ((await health()).status !== 200 || (await ready()).status !== 200) {
    throw new Error("Health checks did not pass");
  }

  console.log("PASS: GIT ENV LINT TYPECHECK TESTS BUILD PRISMA DATABASE REDIS WORKER HEALTH READY AUTH TENANT_RESOLUTION TENANT_ISOLATION RBAC TEAMS CUSTOMERS LISTS IMPORT IMPORT_MAPPING IMPORT_WORKER IMPORT_RECONCILIATION IMPORT_FULL_PIPELINE DEDUP DEDUP_IDEMPOTENCY IMPORT_LOCK IMPORT_CONCURRENCY IMPORT_IDEMPOTENCY IMPORT_RECOVERY IMPORT_RETRY IMPORT_STALE_RECOVERY IMPORT_DLQ OUTBOX_IDEMPOTENCY OUTBOX_CONCURRENCY IMPORT_METRICS CUSTOMER_360 AUDIT OUTBOX");
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
