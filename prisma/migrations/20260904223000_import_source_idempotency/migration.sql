DELETE FROM "CustomerSource" source
USING "CustomerSource" duplicate
WHERE source.id > duplicate.id
  AND source."tenantId" = duplicate."tenantId"
  AND source."customerId" = duplicate."customerId"
  AND source."sourceType" = duplicate."sourceType"
  AND source."sourceId" IS NOT DISTINCT FROM duplicate."sourceId";

CREATE UNIQUE INDEX "CustomerSource_tenantId_customerId_sourceType_sourceId_key"
ON "CustomerSource"("tenantId", "customerId", "sourceType", "sourceId");
