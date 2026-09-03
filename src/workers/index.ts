import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { logger } from "@/lib/logger";

async function main() {
  await db.$queryRaw`SELECT 1`;
  logger.info({ service:"worker", event:"postgres_connected" });
  await redis.ping();
  logger.info({ service:"worker", event:"redis_connected" });
  logger.info({ service:"worker", event:"worker_started" });
  await new Promise<void>(() => undefined);
}
main().catch((error) => { logger.error({ service:"worker", event:"worker_failed", error }); process.exit(1); });
