import { describe, expect, it } from "vitest";
import { createOpaqueToken, hashPassword, hashToken, verifyPassword } from "@/lib/auth/crypto";
describe("authentication primitives", () => {
  it("hashes passwords and opaque tokens without storing plaintext", async () => { const password = "StrongPassword!123"; const hash = await hashPassword(password); expect(hash).not.toContain(password); expect(await verifyPassword(password, hash)).toBe(true); expect(await verifyPassword("wrong", hash)).toBe(false); const token = createOpaqueToken(); expect(hashToken(token)).not.toContain(token); });
});
