import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "./app";

const app = createApp();

describe("GET /api/v1/health", () => {
  it("returns 200 with status ok", async () => {
    const response = await request(app).get("/api/v1/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });
});

describe("malformed JSON body", () => {
  it("returns a structured 400 instead of leaking the raw parse error", async () => {
    const response = await request(app)
      .post("/api/v1/health")
      .set("Content-Type", "application/json")
      .send("{not valid json");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: { code: "INVALID_JSON", message: "Request body is not valid JSON" },
    });
  });
});
