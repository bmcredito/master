import { beforeEach, describe, expect, it, vi } from "vitest";

const readinessMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/readiness", () => ({ getReadiness: readinessMock }));

import { GET } from "@/app/ready/route";

describe("GET /ready", () => {
  beforeEach(() => vi.resetAllMocks());

  it("reports connected dependencies", async () => {
    readinessMock.mockResolvedValue({
      status: "ok",
      service: "web",
      timestamp: "2026-01-01T00:00:00.000Z",
      dependencies: { database: "ok", redis: "ok" },
    });

    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: "ok", dependencies: { database: "ok", redis: "ok" } });
  });

  it("does not report ready when a dependency is unavailable", async () => {
    readinessMock.mockRejectedValue(new Error("connection refused"));

    const response = await GET();
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ status: "not_ready", service: "web" });
  });
});

