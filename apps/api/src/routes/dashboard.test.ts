import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../app";
import { signTestAccessToken } from "../test-utils/auth";

const app = createApp();
const authHeader = `Bearer ${signTestAccessToken()}`;

describe("GET /api/v1/dashboard/today", () => {
  it("returns today's cases and follow-up counts", async () => {
    const response = await request(app).get("/api/v1/dashboard/today").set("Authorization", authHeader);

    expect(response.status).toBe(200);
    expect(typeof response.body.date).toBe("string");
    expect(Array.isArray(response.body.casesToday)).toBe(true);
    expect(typeof response.body.followUpCounts.dueToday).toBe("number");
    expect(typeof response.body.followUpCounts.overdue).toBe("number");
  });

  it("rejects requests without a valid access token", async () => {
    const response = await request(app).get("/api/v1/dashboard/today");
    expect(response.status).toBe(401);
  });
});
