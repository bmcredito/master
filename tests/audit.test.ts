import { describe, expect, it, vi } from "vitest";
import { recordEvent } from "@/services/events";

describe("audit events", () => {
  it.each(["USER_CREATED", "USER_INVITED", "ROLE_CHANGED", "TEAM_CREATED", "TEAM_MEMBER_ADDED", "USER_DISABLED"])("persists %s with an outbox event in one transaction boundary", async (action) => {
    const transaction = { auditEvent: { create: vi.fn() }, outboxEvent: { create: vi.fn() } };
    await recordEvent(transaction as never, { tenantId: "tenant-a", actorUserId: "actor", action, entityType: "User", entityId: "entity" });
    expect(transaction.auditEvent.create).toHaveBeenCalledOnce();
    expect(transaction.outboxEvent.create).toHaveBeenCalledWith({ data: expect.objectContaining({ eventType: action, tenantId: "tenant-a" }) });
  });
});
