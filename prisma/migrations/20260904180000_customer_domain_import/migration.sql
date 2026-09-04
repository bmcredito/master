-- CreateEnum
CREATE TYPE "CustomerStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "RelationshipState" AS ENUM ('NEVER_CONTACTED', 'CONTACTED', 'ENGAGED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "IdentifierType" AS ENUM ('PHONE', 'CPF', 'EMAIL', 'EXTERNAL_ID');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('IMPORTED', 'INFERRED', 'CONFIRMED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "CustomerListStatus" AS ENUM ('DRAFT', 'IMPORTING', 'READY', 'FAILED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('DRAFT', 'UPLOADED', 'MAPPING', 'VALIDATING', 'PREVIEWED', 'PROCESSING', 'COMPLETED', 'COMPLETED_WITH_ERRORS', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ImportFileType" AS ENUM ('CSV', 'XLSX');

-- CreateEnum
CREATE TYPE "ImportRowStatus" AS ENUM ('PENDING', 'VALID', 'INVALID', 'CREATED', 'UPDATED', 'DUPLICATE', 'CONFLICT', 'FAILED', 'PROCESSED', 'SKIPPED', 'ERROR');

-- CreateEnum
CREATE TYPE "ImportErrorCode" AS ENUM ('MISSING_NAME', 'INVALID_PHONE', 'INVALID_CPF', 'INVALID_DATE', 'MAPPING_ERROR', 'DUPLICATE', 'UNKNOWN', 'INVALID_FILE', 'INVALID_HEADER', 'INVALID_VALUE', 'FORMULA_INJECTION', 'DUPLICATE_ROW', 'AMBIGUOUS_MATCH', 'CONFLICT', 'LIMIT_EXCEEDED', 'INTERNAL_ERROR');

-- CreateEnum
CREATE TYPE "FactValueType" AS ENUM ('TEXT', 'NUMBER', 'DATE', 'BOOLEAN', 'JSON');

-- CreateEnum
CREATE TYPE "MatchLevel" AS ENUM ('CPF', 'PHONE', 'EMAIL', 'EXTERNAL_ID', 'NONE', 'AMBIGUOUS');

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "fullName" TEXT NOT NULL,
    "status" "CustomerStatus" NOT NULL DEFAULT 'ACTIVE',
    "relationshipState" "RelationshipState" NOT NULL DEFAULT 'NEVER_CONTACTED',
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerIdentifier" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "type" "IdentifierType" NOT NULL,
    "normalizedValue" TEXT NOT NULL,
    "displayValue" TEXT,
    "verification" "VerificationStatus" NOT NULL DEFAULT 'IMPORTED',
    "observedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerIdentifier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerFact" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "valueType" "FactValueType" NOT NULL DEFAULT 'TEXT',
    "source" TEXT NOT NULL,
    "confidence" INTEGER,
    "verification" "VerificationStatus" NOT NULL DEFAULT 'IMPORTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerFact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerTag" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerTagAssignment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerTagAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerSource" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerList" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "CustomerListStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerListMember" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "importId" TEXT,
    "sourceRowNumber" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerListMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Import" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "listId" TEXT,
    "name" TEXT NOT NULL,
    "status" "ImportStatus" NOT NULL DEFAULT 'DRAFT',
    "fileType" "ImportFileType",
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "processedRows" INTEGER NOT NULL DEFAULT 0,
    "errorRows" INTEGER NOT NULL DEFAULT 0,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Import_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportFile" (
    "id" TEXT NOT NULL,
    "importId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "sha256" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportColumnMapping" (
    "id" TEXT NOT NULL,
    "importId" TEXT NOT NULL,
    "sourceColumn" TEXT NOT NULL,
    "targetField" TEXT NOT NULL,
    "confidence" INTEGER NOT NULL DEFAULT 0,
    "confirmed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ImportColumnMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportRow" (
    "id" TEXT NOT NULL,
    "importId" TEXT NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "status" "ImportRowStatus" NOT NULL DEFAULT 'PENDING',
    "rawData" JSONB NOT NULL,
    "normalized" JSONB,
    "customerId" TEXT,
    "matchLevel" "MatchLevel",
    "errorMessage" TEXT,
    "processedAt" TIMESTAMP(3),
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "ImportRow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportError" (
    "id" TEXT NOT NULL,
    "importId" TEXT NOT NULL,
    "rowNumber" INTEGER,
    "code" "ImportErrorCode" NOT NULL,
    "message" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportError_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportSummary" (
    "id" TEXT NOT NULL,
    "importId" TEXT NOT NULL,
    "createdCount" INTEGER NOT NULL DEFAULT 0,
    "updatedCount" INTEGER NOT NULL DEFAULT 0,
    "matchedCount" INTEGER NOT NULL DEFAULT 0,
    "ambiguousCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerDataConflict" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "primaryId" TEXT NOT NULL,
    "secondaryId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "primaryValue" TEXT,
    "secondaryValue" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerDataConflict_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerTimeline" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "metadata" JSONB,
    "actorId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerTimeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerProfileSnapshot" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerProfileSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Customer_tenantId_status_idx" ON "Customer"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Customer_tenantId_relationshipState_idx" ON "Customer"("tenantId", "relationshipState");

-- CreateIndex
CREATE INDEX "Customer_tenantId_fullName_idx" ON "Customer"("tenantId", "fullName");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_id_tenantId_key" ON "Customer"("id", "tenantId");

-- CreateIndex
CREATE INDEX "CustomerIdentifier_customerId_tenantId_idx" ON "CustomerIdentifier"("customerId", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerIdentifier_tenantId_type_normalizedValue_key" ON "CustomerIdentifier"("tenantId", "type", "normalizedValue");

-- CreateIndex
CREATE INDEX "CustomerFact_tenantId_key_idx" ON "CustomerFact"("tenantId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerFact_tenantId_customerId_key_key" ON "CustomerFact"("tenantId", "customerId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerTag_id_tenantId_key" ON "CustomerTag"("id", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerTag_tenantId_name_key" ON "CustomerTag"("tenantId", "name");

-- CreateIndex
CREATE INDEX "CustomerTagAssignment_tenantId_tagId_idx" ON "CustomerTagAssignment"("tenantId", "tagId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerTagAssignment_tenantId_customerId_tagId_key" ON "CustomerTagAssignment"("tenantId", "customerId", "tagId");

-- CreateIndex
CREATE INDEX "CustomerSource_tenantId_sourceType_idx" ON "CustomerSource"("tenantId", "sourceType");

-- CreateIndex
CREATE INDEX "CustomerSource_customerId_tenantId_idx" ON "CustomerSource"("customerId", "tenantId");

-- CreateIndex
CREATE INDEX "CustomerList_tenantId_status_idx" ON "CustomerList"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerList_id_tenantId_key" ON "CustomerList"("id", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerList_tenantId_name_key" ON "CustomerList"("tenantId", "name");

-- CreateIndex
CREATE INDEX "CustomerListMember_tenantId_customerId_idx" ON "CustomerListMember"("tenantId", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerListMember_tenantId_listId_customerId_key" ON "CustomerListMember"("tenantId", "listId", "customerId");

-- CreateIndex
CREATE INDEX "Import_tenantId_status_idx" ON "Import"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Import_tenantId_idempotencyKey_key" ON "Import"("tenantId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "ImportFile_importId_key" ON "ImportFile"("importId");

-- CreateIndex
CREATE UNIQUE INDEX "ImportColumnMapping_importId_sourceColumn_key" ON "ImportColumnMapping"("importId", "sourceColumn");

-- CreateIndex
CREATE INDEX "ImportRow_importId_status_idx" ON "ImportRow"("importId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ImportRow_importId_rowNumber_key" ON "ImportRow"("importId", "rowNumber");

-- CreateIndex
CREATE INDEX "ImportError_importId_code_idx" ON "ImportError"("importId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "ImportSummary_importId_key" ON "ImportSummary"("importId");

-- CreateIndex
CREATE INDEX "CustomerDataConflict_tenantId_resolvedAt_idx" ON "CustomerDataConflict"("tenantId", "resolvedAt");

-- CreateIndex
CREATE INDEX "CustomerTimeline_tenantId_customerId_occurredAt_idx" ON "CustomerTimeline"("tenantId", "customerId", "occurredAt");

-- CreateIndex
CREATE INDEX "CustomerProfileSnapshot_tenantId_customerId_createdAt_idx" ON "CustomerProfileSnapshot"("tenantId", "customerId", "createdAt");

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerIdentifier" ADD CONSTRAINT "CustomerIdentifier_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerIdentifier" ADD CONSTRAINT "CustomerIdentifier_customerId_tenantId_fkey" FOREIGN KEY ("customerId", "tenantId") REFERENCES "Customer"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerFact" ADD CONSTRAINT "CustomerFact_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerFact" ADD CONSTRAINT "CustomerFact_customerId_tenantId_fkey" FOREIGN KEY ("customerId", "tenantId") REFERENCES "Customer"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerTag" ADD CONSTRAINT "CustomerTag_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerTagAssignment" ADD CONSTRAINT "CustomerTagAssignment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerTagAssignment" ADD CONSTRAINT "CustomerTagAssignment_customerId_tenantId_fkey" FOREIGN KEY ("customerId", "tenantId") REFERENCES "Customer"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerTagAssignment" ADD CONSTRAINT "CustomerTagAssignment_tagId_tenantId_fkey" FOREIGN KEY ("tagId", "tenantId") REFERENCES "CustomerTag"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerSource" ADD CONSTRAINT "CustomerSource_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerSource" ADD CONSTRAINT "CustomerSource_customerId_tenantId_fkey" FOREIGN KEY ("customerId", "tenantId") REFERENCES "Customer"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerList" ADD CONSTRAINT "CustomerList_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerListMember" ADD CONSTRAINT "CustomerListMember_listId_tenantId_fkey" FOREIGN KEY ("listId", "tenantId") REFERENCES "CustomerList"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerListMember" ADD CONSTRAINT "CustomerListMember_customerId_tenantId_fkey" FOREIGN KEY ("customerId", "tenantId") REFERENCES "Customer"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CustomerListMember" ADD CONSTRAINT "CustomerListMember_importId_fkey" FOREIGN KEY ("importId") REFERENCES "Import"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerListMember" ADD CONSTRAINT "CustomerListMember_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Import" ADD CONSTRAINT "Import_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Import" ADD CONSTRAINT "Import_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Import" ADD CONSTRAINT "Import_listId_tenantId_fkey" FOREIGN KEY ("listId", "tenantId") REFERENCES "CustomerList"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportFile" ADD CONSTRAINT "ImportFile_importId_fkey" FOREIGN KEY ("importId") REFERENCES "Import"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportColumnMapping" ADD CONSTRAINT "ImportColumnMapping_importId_fkey" FOREIGN KEY ("importId") REFERENCES "Import"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportRow" ADD CONSTRAINT "ImportRow_importId_fkey" FOREIGN KEY ("importId") REFERENCES "Import"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportRow" ADD CONSTRAINT "ImportRow_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportRow" ADD CONSTRAINT "ImportRow_customerId_tenantId_fkey" FOREIGN KEY ("customerId", "tenantId") REFERENCES "Customer"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportError" ADD CONSTRAINT "ImportError_importId_fkey" FOREIGN KEY ("importId") REFERENCES "Import"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportSummary" ADD CONSTRAINT "ImportSummary_importId_fkey" FOREIGN KEY ("importId") REFERENCES "Import"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerDataConflict" ADD CONSTRAINT "CustomerDataConflict_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerDataConflict" ADD CONSTRAINT "CustomerDataConflict_primaryId_tenantId_fkey" FOREIGN KEY ("primaryId", "tenantId") REFERENCES "Customer"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerDataConflict" ADD CONSTRAINT "CustomerDataConflict_secondaryId_tenantId_fkey" FOREIGN KEY ("secondaryId", "tenantId") REFERENCES "Customer"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerTimeline" ADD CONSTRAINT "CustomerTimeline_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerTimeline" ADD CONSTRAINT "CustomerTimeline_customerId_tenantId_fkey" FOREIGN KEY ("customerId", "tenantId") REFERENCES "Customer"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerTimeline" ADD CONSTRAINT "CustomerTimeline_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerProfileSnapshot" ADD CONSTRAINT "CustomerProfileSnapshot_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerProfileSnapshot" ADD CONSTRAINT "CustomerProfileSnapshot_customerId_tenantId_fkey" FOREIGN KEY ("customerId", "tenantId") REFERENCES "Customer"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
