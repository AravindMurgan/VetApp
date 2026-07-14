import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../app";
import { prisma } from "../lib/prisma-client";
import { signTestAccessToken } from "../test-utils/auth";

const app = createApp();
const authHeader = `Bearer ${signTestAccessToken()}`;

describe("GET /api/v1/vaccine-schedules", () => {
  it("returns the seeded schedules", async () => {
    const response = await request(app)
      .get("/api/v1/vaccine-schedules")
      .set("Authorization", authHeader);

    expect(response.status).toBe(200);
    expect(
      response.body.vaccineSchedules.some((s: { vaccineName: string }) => s.vaccineName === "DHPPi"),
    ).toBe(true);
  });

  it("filters by species", async () => {
    const response = await request(app)
      .get("/api/v1/vaccine-schedules?species=CAT")
      .set("Authorization", authHeader);

    expect(response.status).toBe(200);
    for (const schedule of response.body.vaccineSchedules) {
      expect(schedule.species).toBe("CAT");
    }
  });

  it("rejects an invalid species filter", async () => {
    const response = await request(app)
      .get("/api/v1/vaccine-schedules?species=DRAGON")
      .set("Authorization", authHeader);

    expect(response.status).toBe(400);
  });

  it("rejects requests without a valid access token", async () => {
    const response = await request(app).get("/api/v1/vaccine-schedules");
    expect(response.status).toBe(401);
  });
});

describe("PATCH /api/v1/vaccine-schedules/:id", () => {
  it("updates isActive and restores it afterward", async () => {
    const schedule = await prisma.vaccineSchedule.findFirstOrThrow({
      where: { vaccineName: "Kennel cough" },
    });

    const response = await request(app)
      .patch(`/api/v1/vaccine-schedules/${schedule.id}`)
      .set("Authorization", authHeader)
      .send({ isActive: false });

    expect(response.status).toBe(200);
    expect(response.body.isActive).toBe(false);

    await prisma.vaccineSchedule.update({ where: { id: schedule.id }, data: { isActive: true } });
  });

  it("returns 404 for an unknown schedule id", async () => {
    const response = await request(app)
      .patch("/api/v1/vaccine-schedules/3fa85f64-5717-4562-b3fc-2c963f66afa6")
      .set("Authorization", authHeader)
      .send({ isActive: false });

    expect(response.status).toBe(404);
  });
});
