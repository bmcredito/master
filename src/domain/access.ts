import type { AccessScope, Role } from "@prisma/client";

export const capabilities = [
  "tenant.read", "tenant.manage", "users.read", "users.create", "users.update",
  "users.disable", "users.manage_roles", "teams.read", "teams.create", "teams.update",
  "teams.archive", "teams.manage_members", "audit.read", "settings.read", "settings.update",
] as const;

export type Capability = (typeof capabilities)[number];

export const roleCapabilities: Record<Role, readonly Capability[]> = {
  PLATFORM_ADMIN: [],
  TENANT_MASTER: capabilities,
  TENANT_MANAGER: ["tenant.read", "users.read", "teams.read", "teams.manage_members", "settings.read"],
  CONSULTANT: [],
};

export const roleAccessScope: Record<Role, AccessScope> = {
  PLATFORM_ADMIN: "TENANT",
  TENANT_MASTER: "TENANT",
  TENANT_MANAGER: "TEAM",
  CONSULTANT: "ASSIGNED",
};

export type AuthorizationContext = {
  userId: string;
  tenantId: string;
  membershipId: string;
  role: Role;
  capabilities: readonly Capability[];
  accessScope: AccessScope;
};

export function can(context: AuthorizationContext, capability: Capability) {
  return context.capabilities.includes(capability);
}
