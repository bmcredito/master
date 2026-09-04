import { describe, expect, it } from "vitest";
import { isRetryable, retryDelayMs } from "@/services/import-policy";

describe("import hardening policy", () => {
  it("uses exponential retry backoff", () => {
    expect(retryDelayMs(1)).toBe(1000);
    expect(retryDelayMs(3)).toBe(4000);
  });
  it("keeps validation failures out of retries", () => {
    expect(isRetryable(new Error("invalid phone"))).toBe(false);
    expect(isRetryable(new Error("database timeout"))).toBe(true);
  });
});
