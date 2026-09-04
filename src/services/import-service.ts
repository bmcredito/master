import type { AuthorizationContext } from "@/domain/access";
import type { MatchLevel } from "@prisma/client";
import { requireCapability } from "@/lib/auth/context";
import { db } from "@/lib/db";
import { ConflictError, NotFoundError } from "@/domain/errors";
import { applyColumnMapping, normalizeCustomerRow, suggestMapping } from "@/services/customer-import/normalization";
import { validateColumnMapping, type MappingInput } from "@/services/customer-import/mapping";
import { parseImportFile } from "@/services/customer-import/parser";
import { recordEvent } from "@/services/events";
import { importMaxAttempts, importStaleTimeoutMs, isRetryable, retryDelayMs } from "@/services/import-policy";

const maxBytes = Number(process.env.IMPORT_MAX_FILE_BYTES ?? 10 * 1024 * 1024);
const maxRows = Number(process.env.IMPORT_MAX_ROWS ?? 10000);

type ImportRuntimeMetrics = {
  startedAtMs: number;
  startRss: number;
  peakRss: number;
  endRss: number;
  startHeapUsed: number;
  peakHeapUsed: number;
  endHeapUsed: number;
  heapTotal: number;
  chunkDurationsMs: number[];
  dedupLookupMs: number;
  transactionMs: number;
  retryCount: number;
  workerIds: string[];
};

function runtimeMetrics(value: unknown, startedAtMs: number, workerId: string): ImportRuntimeMetrics {
  const memory = process.memoryUsage();
  const stored = value && typeof value === "object" ? value as Partial<ImportRuntimeMetrics> : {};
  return {
    startedAtMs: stored.startedAtMs ?? startedAtMs,
    startRss: stored.startRss ?? memory.rss,
    peakRss: Math.max(stored.peakRss ?? 0, memory.rss),
    endRss: memory.rss,
    startHeapUsed: stored.startHeapUsed ?? memory.heapUsed,
    peakHeapUsed: Math.max(stored.peakHeapUsed ?? 0, memory.heapUsed),
    endHeapUsed: memory.heapUsed,
    heapTotal: memory.heapTotal,
    chunkDurationsMs: stored.chunkDurationsMs ?? [],
    dedupLookupMs: stored.dedupLookupMs ?? 0,
    transactionMs: stored.transactionMs ?? 0,
    retryCount: stored.retryCount ?? 0,
    workerIds: Array.from(new Set([...(stored.workerIds ?? []), workerId])),
  };
}

export async function createImport(context: AuthorizationContext, fileName: string, mimeType: string, content: Buffer, listId?: string) {
  requireCapability(context, "lists.import");
  if (content.byteLength > maxBytes) throw new ConflictError("Import file exceeds the configured size limit");
  const fileType = /\.xlsx$/i.test(fileName) ? "XLSX" : /\.csv$/i.test(fileName) ? "CSV" : null;
  if (!fileType || (fileType === "CSV" && !["text/csv", "application/csv", "text/plain", "application/octet-stream"].includes(mimeType))) throw new ConflictError("Only CSV and XLSX files are supported");
  const parsed = parseImportFile(content, fileType, maxRows);
  if (listId && !await db.customerList.findFirst({ where: { id: listId, tenantId: context.tenantId, status: { not: "ARCHIVED" } } })) throw new NotFoundError();
  const created = await db.$transaction(async (transaction) => {
    const createdImport = await transaction.import.create({ data: { tenantId: context.tenantId, createdById: context.userId, listId, name: fileName, fileType, status: "PREVIEWED", totalRows: parsed.rows.length, file: { create: { fileName, mimeType, sizeBytes: content.byteLength } }, rows: { create: parsed.rows.map((row, index) => ({ tenantId: context.tenantId, rowNumber: index + 2, rawData: row })) }, mappings: { create: Object.entries(suggestMapping(parsed.headers)).map(([sourceColumn, targetField]) => ({ tenantId: context.tenantId, sourceColumn, targetField: targetField ?? "ignore", confidence: targetField ? 100 : 0, status: targetField ? "SUGGESTED" : "UNMAPPED" })) } } });
    if (listId) await transaction.customerList.update({ where: { id_tenantId: { id: listId, tenantId: context.tenantId } }, data: { status: "IMPORTING" } });
    await recordEvent(transaction, { tenantId: context.tenantId, actorUserId: context.userId, action: "CUSTOMER_IMPORT_PREVIEWED", entityType: "Import", entityId: createdImport.id, metadata: { rows: parsed.rows.length, fileType }, idempotencyKey: `import-preview:${createdImport.id}` });
    return createdImport;
  });
  return { ...created, headers: parsed.headers };
}

export async function startImport(context: AuthorizationContext, importId: string) {
  requireCapability(context, "lists.import");
  const item = await db.import.findFirst({ where: { id: importId, tenantId: context.tenantId, status: "PREVIEWED" }, include: { mappings: true } });
  if (!item) throw new NotFoundError();
  if (!item.mappings.length || item.mappings.some((mapping) => !mapping.confirmed)) throw new ConflictError("Confirm the column mapping before starting the import");
  const result = await db.$transaction(async (transaction) => {
    const updated = await transaction.import.updateMany({ where: { id: importId, tenantId: context.tenantId, status: "PREVIEWED" }, data: { status: "PROCESSING" } });
    if (!updated.count) throw new ConflictError("Import is no longer ready to start");
    await recordEvent(transaction, { tenantId: context.tenantId, actorUserId: context.userId, action: "IMPORT_STARTED", entityType: "Import", entityId: importId, idempotencyKey: `import-start:${importId}` });
    return transaction.import.findUniqueOrThrow({ where: { id: importId } });
  });
  return result;
}

export async function getImport(context: AuthorizationContext, importId: string) {
  requireCapability(context, "lists.read");
  const item = await db.import.findFirst({ where: { id: importId, tenantId: context.tenantId }, include: { mappings: true, summary: true, errors: true } });
  if (!item) throw new NotFoundError();
  return item;
}

export async function saveImportMapping(context: AuthorizationContext, importId: string, input: MappingInput) {
  requireCapability(context, "lists.import");
  const item = await db.import.findFirst({ where: { id: importId, tenantId: context.tenantId, status: "PREVIEWED" }, include: { rows: { take: 1, orderBy: { rowNumber: "asc" } }, mappings: true } });
  if (!item) throw new NotFoundError();
  const headers = item.rows[0] ? Object.keys(item.rows[0].rawData as Record<string, unknown>) : item.mappings.map((mapping) => mapping.sourceColumn);
  validateColumnMapping(input, headers);
  return db.$transaction(async (transaction) => {
    await transaction.importColumnMapping.deleteMany({ where: { importId, tenantId: context.tenantId } });
    await transaction.importColumnMapping.createMany({ data: Object.entries(input).map(([sourceColumn, targetField]) => ({ tenantId: context.tenantId, importId, sourceColumn, targetField: targetField ?? "ignore", confirmed: true, status: !targetField || targetField === "ignore" ? "IGNORED" : "CONFIRMED" })) });
    await recordEvent(transaction, { tenantId: context.tenantId, actorUserId: context.userId, action: "IMPORT_MAPPING_CONFIRMED", entityType: "Import", entityId: importId, metadata: { columns: Object.keys(input).length }, idempotencyKey: `import-mapping:${importId}` });
    return transaction.import.findUniqueOrThrow({ where: { id: importId }, include: { mappings: true } });
  });
}

export async function recoverStaleImports(now = new Date()) {
  const cutoff = new Date(now.getTime() - importStaleTimeoutMs);
  return (await db.import.updateMany({ where: { status: "PROCESSING", heartbeatAt: { lt: cutoff } }, data: { lockOwner: null, lockedAt: null, heartbeatAt: null, lastError: "Recovered stale import lock" } })).count;
}

export async function processImportBatch(batchSize = 100, workerId = process.env.WORKER_ID ?? `worker-${process.pid}`) {
  await recoverStaleImports();
  const candidate = await db.import.findFirst({ where: { status: "PROCESSING", lockOwner: null }, orderBy: { createdAt: "asc" } });
  if (!candidate) return 0;
  const runStartedAt = candidate.startedAt ?? new Date();
  const claimed = await db.import.updateMany({ where: { id: candidate.id, status: "PROCESSING", lockOwner: null }, data: { lockOwner: workerId, lockedAt: new Date(), heartbeatAt: new Date(), startedAt: runStartedAt, enqueuedAt: candidate.enqueuedAt ?? candidate.createdAt } });
  if (!claimed.count) return 0;
  const started = Date.now();
  const metrics = runtimeMetrics(candidate.metrics, runStartedAt.getTime(), workerId);
  try {
    const mappings = await db.importColumnMapping.findMany({ where: { importId: candidate.id, tenantId: candidate.tenantId, confirmed: true } });
    const mapping = Object.fromEntries(mappings.map((item) => [item.sourceColumn, item.targetField]));
    const rows = await db.importRow.findMany({ where: { importId: candidate.id, status: "PENDING", OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: new Date() } }] }, orderBy: { rowNumber: "asc" }, take: batchSize });
    for (const row of rows) {
      try {
        const normalized = normalizeCustomerRow(applyColumnMapping(row.rawData as Record<string, unknown>, mapping));
        const identifiers = (["cpf", "phone", "email", "externalId"] as const).flatMap((key) => normalized[key] ? [{ type: key === "externalId" ? "EXTERNAL_ID" as const : key === "phone" ? "PHONE" as const : key === "cpf" ? "CPF" as const : "EMAIL" as const, value: normalized[key] as string }] : []);
        const dedupStarted = Date.now();
        const candidates = identifiers.length ? await db.customerIdentifier.findMany({ where: { tenantId: candidate.tenantId, OR: identifiers.map((identifier) => ({ type: identifier.type, normalizedValue: identifier.value })) }, select: { customerId: true, type: true } }) : [];
        metrics.dedupLookupMs += Date.now() - dedupStarted;
        const priority = ["CPF", "PHONE", "EMAIL", "EXTERNAL_ID"] as const;
        const matched = priority.map((type) => candidates.filter((item) => item.type === type)).find((items) => items.length > 0) ?? [];
        const distinctCustomers = new Set(matched.map((item) => item.customerId));
        if (distinctCustomers.size > 1) throw new Error("Ambiguous identifier match");
        const match = matched[0] ? { customerId: matched[0].customerId, level: matched[0].type } : null;
        const transactionStarted = Date.now();
        await db.$transaction(async (transaction) => {
          const customer = match ? await transaction.customer.findUniqueOrThrow({ where: { id_tenantId: { id: match.customerId, tenantId: candidate.tenantId } } }) : await transaction.customer.create({ data: { tenantId: candidate.tenantId, displayName: normalized.fullName, fullName: normalized.fullName, identifiers: { create: identifiers.map((identifier) => ({ type: identifier.type, normalizedValue: identifier.value, verification: "IMPORTED" })) }, facts: { create: Object.entries(normalized.facts).map(([key, value]) => ({ key, value, source: `IMPORT:${candidate.id}`, verification: "IMPORTED" })) } } });
          for (const [key, value] of Object.entries(normalized.facts)) await transaction.customerFact.upsert({ where: { tenantId_customerId_key: { tenantId: candidate.tenantId, customerId: customer.id, key } }, create: { tenantId: candidate.tenantId, customerId: customer.id, key, value, source: `IMPORT:${candidate.id}`, verification: "IMPORTED" }, update: { value, source: `IMPORT:${candidate.id}`, verification: "IMPORTED" } });
          await transaction.customerSource.createMany({ data: [{ tenantId: candidate.tenantId, customerId: customer.id, sourceType: "IMPORT", sourceId: candidate.id, metadata: { rowNumber: row.rowNumber } }], skipDuplicates: true });
          await recordEvent(transaction, { tenantId: candidate.tenantId, action: "CUSTOMER_IMPORTED", entityType: "Customer", entityId: customer.id, metadata: { importId: candidate.id }, idempotencyKey: `customer-import:${candidate.id}:${row.rowNumber}` });
          if (candidate.listId) { const membership = await transaction.customerListMember.upsert({ where: { tenantId_listId_customerId: { tenantId: candidate.tenantId, listId: candidate.listId, customerId: customer.id } }, create: { tenantId: candidate.tenantId, listId: candidate.listId, customerId: customer.id, importId: candidate.id, sourceRowNumber: row.rowNumber }, update: { importId: candidate.id, sourceRowNumber: row.rowNumber } }); await recordEvent(transaction, { tenantId: candidate.tenantId, action: "CUSTOMER_ADDED_TO_LIST", entityType: "CustomerList", entityId: candidate.listId, metadata: { customerId: membership.customerId, importId: candidate.id }, idempotencyKey: `list-member:${candidate.id}:${row.rowNumber}` }); }
          await transaction.importRow.update({ where: { id: row.id }, data: { status: "PROCESSED", customerId: customer.id, matchLevel: (match?.level ?? "NONE") as MatchLevel, normalized: normalized as object, processedAt: new Date(), nextAttemptAt: null } });
        });
        metrics.transactionMs += Date.now() - transactionStarted;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Import row failed";
        const retryable = isRetryable(error) && row.attempts + 1 < importMaxAttempts;
        if (retryable) metrics.retryCount += 1;
        await db.$transaction(async (transaction) => { await transaction.importRow.update({ where: { id: row.id }, data: { status: retryable ? "PENDING" : "ERROR", attempts: { increment: 1 }, nextAttemptAt: retryable ? new Date(Date.now() + retryDelayMs(row.attempts + 1)) : null, errorMessage: message, processedAt: retryable ? null : new Date() } }); if (!retryable) await transaction.importError.create({ data: { importId: candidate.id, rowNumber: row.rowNumber, code: "INTERNAL_ERROR", message: message.slice(0, 500), details: { attempts: row.attempts + 1, deadLetter: true } } }); });
      }
    }
    const memory = process.memoryUsage();
    const chunkDurationMs = Date.now() - started;
    metrics.chunkDurationsMs.push(chunkDurationMs);
    metrics.peakRss = Math.max(metrics.peakRss, memory.rss);
    metrics.endRss = memory.rss;
    metrics.peakHeapUsed = Math.max(metrics.peakHeapUsed, memory.heapUsed);
    metrics.endHeapUsed = memory.heapUsed;
    metrics.heapTotal = memory.heapTotal;
    const [pending, errors, processed] = await Promise.all([db.importRow.count({ where: { importId: candidate.id, status: "PENDING" } }), db.importRow.count({ where: { importId: candidate.id, status: "ERROR" } }), db.importRow.count({ where: { importId: candidate.id, status: "PROCESSED" } })]);
    await db.import.updateMany({ where: { id: candidate.id, lockOwner: workerId }, data: { heartbeatAt: new Date(), processedRows: processed, errorRows: errors, metrics } });
    if (!pending) {
      const [created, matched] = await Promise.all([db.importRow.count({ where: { importId: candidate.id, status: "PROCESSED", matchLevel: "NONE" } }), db.importRow.count({ where: { importId: candidate.id, status: "PROCESSED", matchLevel: { not: "NONE" } } })]);
      const durationMs = Date.now() - metrics.startedAtMs;
      const sortedChunks = [...metrics.chunkDurationsMs].sort((left, right) => left - right);
      const persistedMetrics = { ...metrics, durationMs, rowsPerSecond: Math.round((candidate.totalRows / Math.max(1, durationMs)) * 1000), chunkSize: batchSize, chunkCount: metrics.chunkDurationsMs.length, avgChunkDurationMs: Math.round(metrics.chunkDurationsMs.reduce((sum, value) => sum + value, 0) / metrics.chunkDurationsMs.length), maxChunkDurationMs: Math.max(...metrics.chunkDurationsMs), p95ChunkDurationMs: sortedChunks[Math.max(0, Math.ceil(sortedChunks.length * 0.95) - 1)], avgTransactionMs: processed ? Math.round(metrics.transactionMs / processed) : 0 };
      const completed = await db.import.update({ where: { id: candidate.id }, data: { status: errors ? "COMPLETED_WITH_ERRORS" : "COMPLETED", processedRows: processed, errorRows: errors, completedAt: new Date(), processingMs: durationMs, queueWaitMs: runStartedAt.getTime() - candidate.createdAt.getTime(), metrics: persistedMetrics, summary: { upsert: { create: { createdCount: created, updatedCount: matched, matchedCount: matched, errorCount: errors }, update: { createdCount: created, updatedCount: matched, matchedCount: matched, errorCount: errors } } } } });
      await db.$transaction(async (transaction) => { await recordEvent(transaction, { tenantId: candidate.tenantId, action: "IMPORT_COMPLETED", entityType: "Import", entityId: candidate.id, metadata: { processedRows: completed.processedRows, errorRows: errors }, idempotencyKey: `import-complete:${candidate.id}` }); });
      if (candidate.listId) await db.customerList.update({ where: { id_tenantId: { id: candidate.listId, tenantId: candidate.tenantId } }, data: { status: errors ? "FAILED" : "READY" } });
    }
    return rows.length;
  } catch (error) {
    await db.import.updateMany({ where: { id: candidate.id, lockOwner: workerId }, data: { lastError: error instanceof Error ? error.message.slice(0, 500) : "Import failed" } });
    return 0;
  } finally {
    await db.import.updateMany({ where: { id: candidate.id, lockOwner: workerId }, data: { lockOwner: null, lockedAt: null, heartbeatAt: new Date() } });
  }
}
