import { checkDatabaseConnection } from "@/lib/db";
import { checkRedisConnection } from "@/lib/redis";
import { logger } from "@/lib/logger";

export type WorkerDependencies = {
  checkDatabase: () => Promise<void>;
  checkRedis: () => Promise<void>;
  waitForShutdown: () => Promise<void>;
};

function waitForShutdown() {
  return new Promise<void>(() => undefined);
}

export async function startWorker(dependencies: WorkerDependencies = {
  checkDatabase: checkDatabaseConnection,
  checkRedis: checkRedisConnection,
  waitForShutdown,
}) {
  await dependencies.checkDatabase();
  logger.info({ service:"worker", event:"postgres_connected" });
  await dependencies.checkRedis();
  logger.info({ service:"worker", event:"redis_connected" });
  logger.info({ service:"worker", event:"worker_started" });
  await dependencies.waitForShutdown();
}

