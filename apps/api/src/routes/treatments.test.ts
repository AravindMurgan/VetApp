import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../app";
import { signTestAccessToken } from "../test-utils/auth";

const app = createApp();
const authHeader = `Bearer ${signTestAccessToken()}`;

describe("GET /api/v1/treatments/drug-names", () => {
  it("returns a list of distinct drug names", async () => {
    const response = await request(app)
      .get("/api/v1/treatments/drug-names")
      .set("Authorization", authHeader);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.drugNames)).toBe(true);
    const unique = new Set(response.body.drugNames);
    expect(unique.size).toBe(response.body.drugNames.length);
  });

  it("rejects requests without a valid access token", async () => {
    const response = await request(app).get("/api/v1/treatments/drug-names");
    expect(response.status).toBe(401);
  });
});
