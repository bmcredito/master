import { describe, expect, it, vi } from "vitest";
import { processOutboxBatch } from "@/services/outbox-service";

describe("outbox", () => {
  it("locks and marks an event processed once", async () => {
    const outboxEvent = { findMany: vi.fn().mockResolvedValue([{ id: "event-1", tenantId: "tenant-a" }]), updateMany: vi.fn().mockResolvedValue({ count: 1 }), update: vi.fn().mockResolvedValue({}) };
    expect(await processOutboxBatch(25, { outboxEvent } as never)).toBe(1);
    expect(outboxEvent.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ processedAt: expect.any(Date) }) }));
  });
  it("skips an event locked by another worker", async () => {
    const outboxEvent = { findMany: vi.fn().mockResolvedValue([{ id: "event-1" }]), updateMany: vi.fn().mockResolvedValue({ count: 0 }), update: vi.fn() };
    await processOutboxBatch(25, { outboxEvent } as never);
    expect(outboxEvent.update).not.toHaveBeenCalled();
  });
  it("unlocks failed events for retry without marking them processed", async () => {
    const outboxEvent = { findMany: vi.fn().mockResolvedValue([{ id: "event-1" }]), updateMany: vi.fn().mockResolvedValue({ count: 1 }), update: vi.fn().mockRejectedValueOnce(new Error("temporary")).mockResolvedValueOnce({}) };
    await processOutboxBatch(25, { outboxEvent } as never);
    expect(outboxEvent.update).toHaveBeenLastCalledWith({ where: { id: "event-1" }, data: { lockedAt: null, lastError: "temporary" } });
  });
});
