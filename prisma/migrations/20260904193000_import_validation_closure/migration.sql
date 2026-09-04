ALTER TABLE "Customer" ADD COLUMN "lastContactAt" TIMESTAMP(3), ADD COLUMN "lastInboundAt" TIMESTAMP(3), ADD COLUMN "lastOutboundAt" TIMESTAMP(3);

ALTER TABLE "ImportColumnMapping" ADD COLUMN "tenantId" TEXT NOT NULL DEFAULT '';
ALTER TABLE "ImportColumnMapping" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'SUGGESTED';
ALTER TABLE "ImportColumnMapping" ADD COLUMN "config" JSONB;

UPDATE "ImportColumnMapping" AS mapping
SET "tenantId" = import."tenantId"
FROM "Import" AS import
WHERE mapping."importId" = import.id;

ALTER TABLE "ImportColumnMapping" ALTER COLUMN "tenantId" DROP DEFAULT;
CREATE INDEX "ImportColumnMapping_tenantId_importId_idx" ON "ImportColumnMapping"("tenantId", "importId");
ALTER TABLE "ImportColumnMapping" ADD CONSTRAINT "ImportColumnMapping_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
