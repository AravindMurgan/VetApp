import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../app";
import { prisma } from "../lib/prisma-client";
import { signTestAccessToken } from "../test-utils/auth";

const app = createApp();
const authHeader = `Bearer ${signTestAccessToken()}`;
const createdOwnerIds: string[] = [];

describe("follow-ups routes", () => {
  let patientId: string;
  let followUpId: string;

  beforeAll(async () => {
    const owner = await prisma.owner.create({
      data: {
        name: "Follow-up Route Owner",
        phone: "5557770003",
        patients: { create: { name: "Follow-up Route Pet", species: "DOG" } },
      },
      include: { patients: true },
    });
    createdOwnerIds.push(owner.id);
    patientId = owner.patients[0]!.id;

    const followUp = await prisma.followUp.create({
      data: { patientId, dueDate: new Date(), reason: "RECHECK", status: "PENDING" },
    });
    followUpId = followUp.id;
  });

  afterAll(async () => {
    await prisma.followUp.deleteMany({ where: { patientId } });
    await prisma.patient.deleteMany({ where: { ownerId: { in: createdOwnerIds } } });
    await prisma.owner.deleteMany({ where: { id: { in: createdOwnerIds } } });
  });

  it("returns follow-ups for the today bucket", async () => {
    const response = await request(app)
      .get("/api/v1/followups?bucket=today")
      .set("Authorization", authHeader);

    expect(response.status).toBe(200);
    expect(response.body.followUps.some((f: { id: string }) => f.id === followUpId)).toBe(true);
  });

  it("rejects an invalid bucket", async () => {
    const response = await request(app)
      .get("/api/v1/followups?bucket=eventually")
      .set("Authorization", authHeader);

    expect(response.status).toBe(400);
  });

  it("rejects requests without a valid access token", async () => {
    const response = await request(app).get("/api/v1/followups?bucket=today");
    expect(response.status).toBe(401);
  });

  it("marks a follow-up done and it no longer appears in the today bucket", async () => {
    const patchResponse = await request(app)
      .patch(`/api/v1/followups/${followUpId}`)
      .set("Authorization", authHeader)
      .send({ status: "DONE" });

    expect(patchResponse.status).toBe(200);
    expect(patchResponse.body.status).toBe("DONE");

    const listResponse = await request(app)
      .get("/api/v1/followups?bucket=today")
      .set("Authorization", authHeader);

    expect(listResponse.body.followUps.some((f: { id: string }) => f.id === followUpId)).toBe(false);
  });

  it("returns 404 for an unknown follow-up id", async () => {
    const response = await request(app)
      .patch("/api/v1/followups/3fa85f64-5717-4562-b3fc-2c963f66afa6")
      .set("Authorization", authHeader)
      .send({ status: "DONE" });

    expect(response.status).toBe(404);
  });
});
