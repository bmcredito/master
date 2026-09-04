import { describe, expect, it } from "vitest";
import { environmentSchema } from "@/lib/env";

const validEnvironment = {
  NODE_ENV: "test",
  DATABASE_URL: "postgresql://user:password@localhost:5432/bmcredito",
  REDIS_URL: "redis://localhost:6379",
  APP_URL: "http://localhost:3000",
};

describe("environment validation", () => {
  it("accepts the required infrastructure configuration", () => {
    expect(environmentSchema.safeParse(validEnvironment).success).toBe(true);
  });

  it("rejects a missing database URL", () => {
    const environmentWithoutDatabase = { ...validEnvironment, DATABASE_URL: undefined };
    expect(environmentSchema.safeParse(environmentWithoutDatabase).success).toBe(false);
  });
});

