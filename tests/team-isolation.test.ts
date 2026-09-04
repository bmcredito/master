import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("team isolation", () => {
  it("enforces team and tenant consistency with a composite foreign key", () => {
    const schema = readFileSync("prisma/schema.prisma", "utf8");
    expect(schema).toContain("@relation(fields: [teamId, tenantId], references: [id, tenantId]");
    expect(schema).toContain("@@unique([userId, tenantId])");
  });
});
