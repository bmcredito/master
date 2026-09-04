import { describe, expect, it, vi } from "vitest";
import { startWorker } from "@/workers";

describe("worker startup", () => {
  it("checks both dependencies before waiting for work", async () => {
    const checkDatabase = vi.fn().mockResolvedValue(undefined);
    const checkRedis = vi.fn().mockResolvedValue(undefined);
    const waitForShutdown = vi.fn().mockResolvedValue(undefined);

    await startWorker({ checkDatabase, checkRedis, waitForShutdown });

    expect(checkDatabase).toHaveBeenCalledOnce();
    expect(checkRedis).toHaveBeenCalledOnce();
    expect(waitForShutdown).toHaveBeenCalledOnce();
  });
});

