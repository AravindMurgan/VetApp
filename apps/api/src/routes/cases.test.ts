import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../app";
import { prisma } from "../lib/prisma-client";
import { signTestAccessToken } from "../test-utils/auth";

const app = createApp();
const authHeader = `Bearer ${signTestAccessToken()}`;
const createdOwnerIds: string[] = [];

describe("cases", () => {
  let patientId: string;

  beforeAll(async () => {
    const owner = await prisma.owner.create({
      data: {
        name: "Case Test Owner",
        phone: "5558880001",
        patients: { create: { name: "Case Test Pet", species: "DOG" } },
      },
      include: { patients: true },
    });
    createdOwnerIds.push(owner.id);
    patientId = owner.patients[0]!.id;
  });

  afterAll(async () => {
    await prisma.followUp.deleteMany({ where: { patientId } });
    await prisma.weightEntry.deleteMany({ where: { patientId } });
    await prisma.treatment.deleteMany({ where: { case: { patientId } } });
    await prisma.case.deleteMany({ where: { patientId } });
    await prisma.patient.deleteMany({ where: { ownerId: { in: createdOwnerIds } } });
    await prisma.owner.deleteMany({ where: { id: { in: createdOwnerIds } } });
  });

  it("creates a case with nested treatments, weight entry, and follow-up", async () => {
    const response = await request(app)
      .post(`/api/v1/patients/${patientId}/cases`)
      .set("Authorization", authHeader)
      .send({
        type: "VACCINATION",
        complaint: "Scheduled vaccination",
        treatments: [
          { drugName: "Rabies vaccine", dose: "1 ml", route: "SC" },
          { drugName: "Deworming tablet", dose: "1 tablet", isProcedure: true },
        ],
        weightEntry: { weightKg: 12.4 },
        followUp: { dueDate: "2027-07-13", reason: "VACCINE_DUE", notes: "Annual booster" },
      });

    expect(response.status).toBe(201);
    expect(response.body.patientId).toBe(patientId);
    expect(response.body.treatments).toHaveLength(2);
    expect(response.body.followUps).toHaveLength(1);
    expect(response.body.followUps[0].reason).toBe("VACCINE_DUE");

    const weightEntries = await prisma.weightEntry.findMany({ where: { patientId } });
    expect(weightEntries).toHaveLength(1);
    expect(Number(weightEntries[0]!.weightKg)).toBe(12.4);
  });

  it("returns 404 when creating a case for an unknown patient", async () => {
    const response = await request(app)
      .post("/api/v1/patients/3fa85f64-5717-4562-b3fc-2c963f66afa6/cases")
      .set("Authorization", authHeader)
      .send({ type: "CONSULTATION" });

    expect(response.status).toBe(404);
  });

  it("rolls back the entire transaction when a nested treatment is invalid at the database level", async () => {
    const casesBefore = await prisma.case.count({ where: { patientId } });

    const response = await request(app)
      .post(`/api/v1/patients/${patientId}/cases`)
      .set("Authorization", authHeader)
      .send({
        type: "CONSULTATION",
        treatments: [
          { drugName: "Valid drug", dose: "1 tablet" },
          // durationDays passes zod's `.int().positive()` check but overflows
          // Postgres's 4-byte `integer` column — a genuine DB-level failure
          // reachable through the real API, not a mocked one.
          { drugName: "Invalid drug", dose: "1 tablet", durationDays: 99_999_999_999 },
        ],
      });

    expect(response.status).toBeGreaterThanOrEqual(400);

    const casesAfter = await prisma.case.count({ where: { patientId } });
    expect(casesAfter).toBe(casesBefore);
  });

  it("appends weight entries rather than updating them in place", async () => {
    await request(app)
      .post(`/api/v1/patients/${patientId}/cases`)
      .set("Authorization", authHeader)
      .send({ type: "CONSULTATION", weightEntry: { weightKg: 10 } });

    await request(app)
      .post(`/api/v1/patients/${patientId}/cases`)
      .set("Authorization", authHeader)
      .send({ type: "CONSULTATION", weightEntry: { weightKg: 10.5 } });

    const weightEntries = await prisma.weightEntry.findMany({
      where: { patientId },
      orderBy: { recordedAt: "asc" },
    });

    expect(weightEntries.length).toBeGreaterThanOrEqual(2);
    const weights = weightEntries.map((entry) => Number(entry.weightKg));
    expect(weights).toContain(10);
    expect(weights).toContain(10.5);
  });

  it("fetches a case by id with nested treatments and follow-ups", async () => {
    const created = await request(app)
      .post(`/api/v1/patients/${patientId}/cases`)
      .set("Authorization", authHeader)
      .send({ type: "CONSULTATION", complaint: "Itchy skin" });

    const response = await request(app)
      .get(`/api/v1/cases/${created.body.id}`)
      .set("Authorization", authHeader);

    expect(response.status).toBe(200);
    expect(response.body.complaint).toBe("Itchy skin");
  });

  it("returns 404 for an unknown case id", async () => {
    const response = await request(app)
      .get("/api/v1/cases/3fa85f64-5717-4562-b3fc-2c963f66afa6")
      .set("Authorization", authHeader);

    expect(response.status).toBe(404);
  });

  it("updates a case", async () => {
    const created = await request(app)
      .post(`/api/v1/patients/${patientId}/cases`)
      .set("Authorization", authHeader)
      .send({ type: "CONSULTATION" });

    const response = await request(app)
      .patch(`/api/v1/cases/${created.body.id}`)
      .set("Authorization", authHeader)
      .send({ status: "CLOSED", diagnosis: "Resolved" });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("CLOSED");
    expect(response.body.diagnosis).toBe("Resolved");
  });

  it("rejects requests without a valid access token", async () => {
    const response = await request(app).post(`/api/v1/patients/${patientId}/cases`).send({
      type: "CONSULTATION",
    });

    expect(response.status).toBe(401);
  });
});
