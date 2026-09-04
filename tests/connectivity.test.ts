import { describe, expect, it } from "vitest";
import { checkDatabaseConnection } from "@/lib/db";
import { checkRedisConnection } from "@/lib/redis";

const hasInfrastructure = Boolean(process.env.DATABASE_URL && process.env.REDIS_URL);

describe.skipIf(!hasInfrastructure)("infrastructure connectivity", () => {
  it("connects to PostgreSQL", async () => {
    await expect(checkDatabaseConnection()).resolves.toBeUndefined();
  });

  it("connects to Redis", async () => {
    await expect(checkRedisConnection()).resolves.toBeUndefined();
  });
});

