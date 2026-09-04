import type { Prisma } from "@prisma/client";

type EventInput = { tenantId?: string; actorUserId?: string; action: string; entityType: string; entityId: string; metadata?: Prisma.InputJsonValue };

export async function recordEvent(transaction: Prisma.TransactionClient, input: EventInput) {
  await transaction.auditEvent.create({ data: input });
  await transaction.outboxEvent.create({ data: {
    tenantId: input.tenantId,
    eventType: input.action,
    aggregateType: input.entityType,
    aggregateId: input.entityId,
    payload: { entityId: input.entityId },
  } });
}
