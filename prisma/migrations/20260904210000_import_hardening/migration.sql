ALTER TABLE "AuditEvent" ADD COLUMN "idempotencyKey" TEXT;
CREATE UNIQUE INDEX "AuditEvent_idempotencyKey_key" ON "AuditEvent"("idempotencyKey");

ALTER TABLE "OutboxEvent" ADD COLUMN "idempotencyKey" TEXT;
ALTER TABLE "OutboxEvent" ADD COLUMN "processingAt" TIMESTAMP(3);
CREATE UNIQUE INDEX "OutboxEvent_idempotencyKey_key" ON "OutboxEvent"("idempotencyKey");

ALTER TABLE "Import" ADD COLUMN "lockedAt" TIMESTAMP(3);
ALTER TABLE "Import" ADD COLUMN "lockOwner" TEXT;
ALTER TABLE "Import" ADD COLUMN "heartbeatAt" TIMESTAMP(3);
ALTER TABLE "Import" ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Import" ADD COLUMN "startedAt" TIMESTAMP(3);
ALTER TABLE "Import" ADD COLUMN "completedAt" TIMESTAMP(3);
ALTER TABLE "Import" ADD COLUMN "enqueuedAt" TIMESTAMP(3);
ALTER TABLE "Import" ADD COLUMN "processingMs" INTEGER;
ALTER TABLE "Import" ADD COLUMN "queueWaitMs" INTEGER;
ALTER TABLE "Import" ADD COLUMN "lastError" TEXT;
ALTER TABLE "Import" ADD COLUMN "metrics" JSONB;
CREATE INDEX "Import_status_heartbeatAt_idx" ON "Import"("status", "heartbeatAt");

ALTER TABLE "ImportRow" ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ImportRow" ADD COLUMN "nextAttemptAt" TIMESTAMP(3);
CREATE INDEX "ImportRow_status_nextAttemptAt_idx" ON "ImportRow"("status", "nextAttemptAt");
