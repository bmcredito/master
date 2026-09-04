import { describe, expect, it, vi } from "vitest";
import { AuditRepository, TeamRepository, UserRepository } from "@/repositories/tenant-repositories";

function database() {
  return {
    user: { findMany: vi.fn(), findFirst: vi.fn() },
    team: { findMany: vi.fn(), findFirst: vi.fn() },
    auditEvent: { findMany: vi.fn() },
  };
}

describe("tenant isolation", () => {
  it("scopes user listing, reads and ID enumeration in the database query", async () => {
    const fake = database();
    fake.user.findFirst.mockResolvedValue(null);
    const repository = new UserRepository(fake as never);
    await repository.list("tenant-a");
    expect(fake.user.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { memberships: { some: { tenantId: "tenant-a" } } } }));
    expect(await repository.find("tenant-a", "user-b")).toBeNull();
    expect(fake.user.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ id: "user-b", memberships: { some: { tenantId: "tenant-a" } } }) }));
  });
  it("scopes team listing and edits by tenant", async () => {
    const fake = database();
    const repository = new TeamRepository(fake as never);
    await repository.list("tenant-a");
    await repository.find("tenant-a", "team-b");
    expect(fake.team.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { tenantId: "tenant-a" } }));
    expect(fake.team.findFirst).toHaveBeenCalledWith({ where: { id: "team-b", tenantId: "tenant-a" } });
  });
  it("scopes audit access by tenant", async () => {
    const fake = database();
    await new AuditRepository(fake as never).list("tenant-a");
    expect(fake.auditEvent.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { tenantId: "tenant-a" } }));
  });
});
