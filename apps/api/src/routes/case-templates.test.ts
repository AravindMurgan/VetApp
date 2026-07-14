import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../app";
import { signTestAccessToken } from "../test-utils/auth";

const app = createApp();
const authHeader = `Bearer ${signTestAccessToken()}`;

describe("GET /api/v1/case-templates", () => {
  it("returns the 10 seeded case templates", async () => {
    const response = await request(app).get("/api/v1/case-templates").set("Authorization", authHeader);

    expect(response.status).toBe(200);
    expect(response.body.templates.length).toBeGreaterThanOrEqual(10);
    expect(response.body.templates.some((t: { name: string }) => t.name === "Deworming")).toBe(true);
  });

  it("filters by caseType", async () => {
    const response = await request(app)
      .get("/api/v1/case-templates?caseType=VACCINATION")
      .set("Authorization", authHeader);

    expect(response.status).toBe(200);
    expect(response.body.templates.length).toBeGreaterThanOrEqual(1);
    for (const template of response.body.templates) {
      expect(template.caseType).toBe("VACCINATION");
    }
  });

  it("rejects an invalid caseType filter", async () => {
    const response = await request(app)
      .get("/api/v1/case-templates?caseType=NOT_A_TYPE")
      .set("Authorization", authHeader);

    expect(response.status).toBe(400);
  });

  it("rejects requests without a valid access token", async () => {
    const response = await request(app).get("/api/v1/case-templates");
    expect(response.status).toBe(401);
  });
});
