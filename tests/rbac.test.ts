import { describe, expect, it } from "vitest";
import { roleAccessScope, roleCapabilities } from "@/domain/access";

describe("RBAC matrix", () => {
  it("grants tenant masters all administrative capabilities", () => {
    expect(roleCapabilities.TENANT_MASTER).toEqual(expect.arrayContaining(["users.create", "users.update", "teams.create", "teams.manage_members", "audit.read"]));
    expect(roleAccessScope.TENANT_MASTER).toBe("TENANT");
  });
  it("limits managers and consultants", () => {
    expect(roleCapabilities.TENANT_MANAGER).toEqual(expect.arrayContaining(["users.read", "teams.read"]));
    expect(roleCapabilities.TENANT_MANAGER).not.toContain("users.create");
    expect(roleCapabilities.CONSULTANT).not.toEqual(expect.arrayContaining(["users.create", "teams.create", "audit.read"]));
    expect(roleAccessScope.CONSULTANT).toBe("ASSIGNED");
  });
});
