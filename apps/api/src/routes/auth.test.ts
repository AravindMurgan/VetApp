import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";
import { createApp } from "../app";
import { prisma } from "../lib/prisma-client";
import { signTestAccessToken } from "../test-utils/auth";

const TEST_EMAIL = "auth-test@vetlog.local";
const TEST_PASSWORD = "correct-horse-battery-staple";

const app = createApp();
const authHeader = `Bearer ${signTestAccessToken()}`;

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

  describe("register", () => {
    const NEW_USER_EMAIL = "new-staff@vetlog.local";

    afterAll(async () => {
      await prisma.user.delete({ where: { email: NEW_USER_EMAIL } }).catch(() => undefined);
    });

    it("rejects registration attempts with no access token", async () => {
      const response = await request(app)
        .post("/api/v1/auth/register")
        .send({ email: NEW_USER_EMAIL, password: "another-long-password", clinicName: "VetLog Clinic" });

      expect(response.status).toBe(401);
    });

    it("creates a new user account for an already-authenticated caller", async () => {
      const response = await request(app)
        .post("/api/v1/auth/register")
        .set("Authorization", authHeader)
        .send({ email: NEW_USER_EMAIL, password: "another-long-password", clinicName: "VetLog Clinic" });

      expect(response.status).toBe(201);
      expect(response.body.email).toBe(NEW_USER_EMAIL);
      expect(response.body.clinicName).toBe("VetLog Clinic");
      expect(response.body).not.toHaveProperty("passwordHash");

      const created = await prisma.user.findUnique({ where: { email: NEW_USER_EMAIL } });
      expect(created).not.toBeNull();
    });

    it("rejects a duplicate email with 409", async () => {
      const response = await request(app)
        .post("/api/v1/auth/register")
        .set("Authorization", authHeader)
        .send({ email: TEST_EMAIL, password: "another-long-password", clinicName: "VetLog Clinic" });

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe("EMAIL_CONFLICT");
    });

    it("rejects an invalid registration payload with 400", async () => {
      const response = await request(app)
        .post("/api/v1/auth/register")
        .set("Authorization", authHeader)
        .send({ email: "not-an-email", password: "short", clinicName: "" });

      expect(response.status).toBe(400);
    });
  });
});
