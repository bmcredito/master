import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

type OutboxDatabase = Pick<typeof db, "outboxEvent">;

export async function processOutboxBatch(limit = 25, database: OutboxDatabase = db) {
  const events = await database.outboxEvent.findMany({ where: { processedAt: null, lockedAt: null }, orderBy: { createdAt: "asc" }, take: limit });
  for (const event of events) {
    const locked = await database.outboxEvent.updateMany({ where: { id: event.id, processedAt: null, lockedAt: null }, data: { lockedAt: new Date(), attempts: { increment: 1 } } });
    if (locked.count !== 1) continue;
    try {
      await database.outboxEvent.update({ where: { id: event.id }, data: { processedAt: new Date(), lockedAt: null, lastError: null } });
      logger.info({ event: "outbox_processed", tenantId: event.tenantId, outboxEventId: event.id });
    } catch (error) {
      await database.outboxEvent.update({ where: { id: event.id }, data: { lockedAt: null, lastError: error instanceof Error ? error.message.slice(0, 500) : "Unknown error" } });
    }
  }
  return events.length;
}
