import type { AuthorizationContext } from "@/domain/access";
import type { MatchLevel } from "@prisma/client";
import { requireCapability } from "@/lib/auth/context";
import { db } from "@/lib/db";
import { ConflictError, NotFoundError } from "@/domain/errors";
import { normalizeCustomerRow } from "@/services/customer-import/normalization";
import { parseImportFile } from "@/services/customer-import/parser";
import { recordEvent } from "@/services/events";

const maxBytes = Number(process.env.IMPORT_MAX_FILE_BYTES ?? 10 * 1024 * 1024);
const maxRows = Number(process.env.IMPORT_MAX_ROWS ?? 10000);

export async function createImport(context: AuthorizationContext, fileName: string, mimeType: string, content: Buffer, listId?: string) {
  requireCapability(context, "lists.import");
  if (content.byteLength > maxBytes) throw new ConflictError("Import file exceeds the configured size limit");
  const fileType = /\.xlsx$/i.test(fileName) ? "XLSX" : /\.csv$/i.test(fileName) ? "CSV" : null;
  if (!fileType || (fileType === "CSV" && !["text/csv", "application/csv", "text/plain", "application/octet-stream"].includes(mimeType))) throw new ConflictError("Only CSV and XLSX files are supported");
  const parsed = parseImportFile(content, fileType, maxRows);
  if (listId && !await db.customerList.findFirst({ where: { id: listId, tenantId: context.tenantId, status: { not: "ARCHIVED" } } })) throw new NotFoundError();
  const created = await db.$transaction(async (transaction) => {
    const createdImport = await transaction.import.create({ data: { tenantId: context.tenantId, createdById: context.userId, listId, name: fileName, fileType, status: "PREVIEWED", totalRows: parsed.rows.length, file: { create: { fileName, mimeType, sizeBytes: content.byteLength } }, rows: { create: parsed.rows.map((row, index) => ({ tenantId: context.tenantId, rowNumber: index + 2, rawData: row })) } } });
    if (listId) await transaction.customerList.update({ where: { id_tenantId: { id: listId, tenantId: context.tenantId } }, data: { status: "IMPORTING" } });
    await recordEvent(transaction, { tenantId: context.tenantId, actorUserId: context.userId, action: "CUSTOMER_IMPORT_PREVIEWED", entityType: "Import", entityId: createdImport.id, metadata: { rows: parsed.rows.length, fileType } });
    return createdImport;
  });
  return { ...created, headers: parsed.headers };
}

export async function startImport(context: AuthorizationContext, importId: string) {
  requireCapability(context, "lists.import");
  const result = await db.import.updateMany({ where: { id: importId, tenantId: context.tenantId, status: "PREVIEWED" }, data: { status: "PROCESSING" } });
  if (!result.count) throw new NotFoundError();
  return db.import.findUniqueOrThrow({ where: { id: importId } });
}

export async function processImportBatch(batchSize = 100) {
  const current = await db.import.findFirst({ where: { status: "PROCESSING" }, orderBy: { createdAt: "asc" } });
  if (!current) return 0;
  const rows = await db.importRow.findMany({ where: { importId: current.id, status: "PENDING" }, orderBy: { rowNumber: "asc" }, take: batchSize });
  for (const row of rows) {
    try {
      const normalized = normalizeCustomerRow(row.rawData as Record<string, unknown>);
      const identifiers = (["cpf", "phone", "email", "externalId"] as const).flatMap((key) => normalized[key] ? [{ type: key === "externalId" ? "EXTERNAL_ID" as const : key === "phone" ? "PHONE" as const : key === "cpf" ? "CPF" as const : "EMAIL" as const, value: normalized[key] as string }] : []);
      const candidates = identifiers.length ? await db.customerIdentifier.findMany({ where: { tenantId: current.tenantId, OR: identifiers.map((identifier) => ({ type: identifier.type, normalizedValue: identifier.value })) }, select: { customerId: true, type: true, normalizedValue: true } }) : [];
      const priority = ["CPF", "PHONE", "EMAIL", "EXTERNAL_ID"] as const;
      const matched = priority.map((type) => candidates.filter((candidate) => candidate.type === type)).find((items) => items.length > 0) ?? [];
      const distinctCustomers = new Set(matched.map((candidate) => candidate.customerId));
      if (distinctCustomers.size > 1) throw new Error("Ambiguous identifier match");
      const match = matched[0] ? { customerId: matched[0].customerId, level: matched[0].type } : null;
      await db.$transaction(async (transaction) => {
        const customer = match
          ? await transaction.customer.findUniqueOrThrow({ where: { id_tenantId: { id: match.customerId, tenantId: current.tenantId } } })
          : await transaction.customer.create({
              data: {
                tenantId: current.tenantId,
                displayName: normalized.fullName,
                fullName: normalized.fullName,
                identifiers: { create: identifiers.map((identifier) => ({ type: identifier.type, normalizedValue: identifier.value, verification: "IMPORTED" })) },
                facts: { create: Object.entries(normalized.facts).map(([key, value]) => ({ key, value, source: `IMPORT:${current.id}`, verification: "IMPORTED" })) },
              },
            });
        if (match) for (const [key, value] of Object.entries(normalized.facts)) await transaction.customerFact.upsert({ where: { tenantId_customerId_key: { tenantId: current.tenantId, customerId: customer.id, key } }, create: { tenantId: current.tenantId, customerId: customer.id, key, value, source: `IMPORT:${current.id}`, verification: "IMPORTED" }, update: { value, source: `IMPORT:${current.id}`, verification: "IMPORTED" } });
        await recordEvent(transaction, { tenantId: current.tenantId, action: "CUSTOMER_IMPORTED", entityType: "Customer", entityId: customer.id, metadata: { importId: current.id } });
        if (current.listId) { const membership = await transaction.customerListMember.upsert({ where: { tenantId_listId_customerId: { tenantId: current.tenantId, listId: current.listId, customerId: customer.id } }, create: { tenantId: current.tenantId, listId: current.listId, customerId: customer.id, importId: current.id, sourceRowNumber: row.rowNumber }, update: { importId: current.id, sourceRowNumber: row.rowNumber } }); await recordEvent(transaction, { tenantId: current.tenantId, action: "CUSTOMER_ADDED_TO_LIST", entityType: "CustomerList", entityId: current.listId, metadata: { customerId: membership.customerId, importId: current.id } }); }
        await transaction.importRow.update({ where: { id: row.id }, data: { status: "PROCESSED", customerId: customer.id, matchLevel: (match?.level ?? "NONE") as MatchLevel, normalized: normalized as object, processedAt: new Date() } });
      });
    } catch (error) {
      await db.$transaction(async (transaction) => { await transaction.importRow.update({ where: { id: row.id }, data: { status: "ERROR", errorMessage: error instanceof Error ? error.message : "Import row failed", processedAt: new Date() } }); await transaction.importError.create({ data: { importId: current.id, rowNumber: row.rowNumber, code: "INVALID_VALUE", message: error instanceof Error ? error.message : "Import row failed" } }); });
    }
  }
  const pending = await db.importRow.count({ where: { importId: current.id, status: "PENDING" } });
  if (!pending) { const errors = await db.importRow.count({ where: { importId: current.id, status: "ERROR" } }); await db.import.update({ where: { id: current.id }, data: { status: errors ? "COMPLETED_WITH_ERRORS" : "COMPLETED", processedRows: current.totalRows - errors, errorRows: errors, summary: { upsert: { create: { createdCount: current.totalRows - errors, errorCount: errors }, update: { errorCount: errors } } } } }); if (current.listId) await db.customerList.update({ where: { id_tenantId: { id: current.listId, tenantId: current.tenantId } }, data: { status: errors ? "FAILED" : "READY" } }); }
  return rows.length;
}
