import { describe, expect, it } from "vitest";
import { GET } from "@/app/health/route";

describe("GET /health", () => {
  it("returns a healthy web response", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ status: "ok", service: "web" });
    expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);
  });
});

