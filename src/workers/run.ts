import { logger } from "@/lib/logger";
import { startWorker } from "@/workers";

startWorker().catch((error: unknown) => {
  logger.error({ service: "worker", event: "worker_failed", error });
  process.exit(1);
});

