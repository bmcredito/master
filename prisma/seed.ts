import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/crypto";

if (process.env.NODE_ENV === "production") throw new Error("Seed is disabled in production");
const db = new PrismaClient();

async function main() {
  const passwordHash = await hashPassword("Development!123");
  for (const tenantInput of [{ name: "Tenant Alpha", slug: "tenant-alpha" }, { name: "Tenant Beta", slug: "tenant-beta" }]) {
    await db.tenant.upsert({ where: { slug: tenantInput.slug }, update: {}, create: tenantInput });
  }
  const alpha = await db.tenant.findUniqueOrThrow({ where: { slug: "tenant-alpha" } });
  const beta = await db.tenant.findUniqueOrThrow({ where: { slug: "tenant-beta" } });
  const users = [
    ["Alpha Master", "alpha.master@example.test", alpha.id, "TENANT_MASTER"],
    ["Alpha Manager", "alpha.manager@example.test", alpha.id, "TENANT_MANAGER"],
    ["Alpha Consultant", "alpha.consultant@example.test", alpha.id, "CONSULTANT"],
    ["Beta Master", "beta.master@example.test", beta.id, "TENANT_MASTER"],
    ["Beta Consultant", "beta.consultant@example.test", beta.id, "CONSULTANT"],
  ] as const;
  for (const [name, email, tenantId, role] of users) {
    const user = await db.user.upsert({ where: { email }, update: {}, create: { name, email, passwordHash, status: "ACTIVE" } });
    await db.membership.upsert({ where: { userId_tenantId: { userId: user.id, tenantId } }, update: {}, create: { userId: user.id, tenantId, role, status: "ACTIVE" } });
  }
  await db.$disconnect();
}

void main().catch(async (error: unknown) => { console.error(error); await db.$disconnect(); process.exit(1); });
