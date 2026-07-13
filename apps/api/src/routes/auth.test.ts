import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";
import { createApp } from "../app";
import { prisma } from "../lib/prisma-client";

const TEST_EMAIL = "auth-test@vetlog.local";
const TEST_PASSWORD = "correct-horse-battery-staple";

const app = createApp();

describe("auth", () => {
  beforeAll(async () => {
    const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);
    await prisma.user.upsert({
      where: { email: TEST_EMAIL },
      update: { passwordHash },
      create: { email: TEST_EMAIL, passwordHash, clinicName: "Auth Test Clinic" },
    });
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { email: TEST_EMAIL } }).catch(() => undefined);
  });

  it("logs in with valid credentials and returns an access token", async () => {
    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    expect(response.status).toBe(200);
    expect(typeof response.body.accessToken).toBe("string");
    expect(response.body.user.email).toBe(TEST_EMAIL);
    expect(response.headers["set-cookie"]?.[0]).toMatch(/refreshToken=/);
  });

  it("rejects an invalid password with 401", async () => {
    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: TEST_EMAIL, password: "wrong-password" });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("rejects a protected route with no token", async () => {
    const response = await request(app).get("/api/v1/me");

    expect(response.status).toBe(401);
  });

  it("allows access to a protected route with a valid access token", async () => {
    const loginResponse = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    const response = await request(app)
      .get("/api/v1/me")
      .set("Authorization", `Bearer ${loginResponse.body.accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.email).toBe(TEST_EMAIL);
  });

  it("rotates the refresh token on /auth/refresh", async () => {
    const agent = request.agent(app);

    const loginResponse = await agent
      .post("/api/v1/auth/login")
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    const firstAccessToken = loginResponse.body.accessToken;
    const firstRefreshCookie = loginResponse.headers["set-cookie"]?.[0];

    const refreshResponse = await agent.post("/api/v1/auth/refresh");

    expect(refreshResponse.status).toBe(200);
    expect(typeof refreshResponse.body.accessToken).toBe("string");
    expect(refreshResponse.body.accessToken).not.toBe(firstAccessToken);

    const secondRefreshCookie = refreshResponse.headers["set-cookie"]?.[0];
    expect(secondRefreshCookie).toBeDefined();
    expect(secondRefreshCookie).not.toBe(firstRefreshCookie);
  });

  it("rejects /auth/refresh with no refresh cookie", async () => {
    const response = await request(app).post("/api/v1/auth/refresh");

    expect(response.status).toBe(401);
  });
});
