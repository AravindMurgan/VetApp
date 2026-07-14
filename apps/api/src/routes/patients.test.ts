import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../app";
import { prisma } from "../lib/prisma-client";
import { signTestAccessToken } from "../test-utils/auth";

const app = createApp();
const authHeader = `Bearer ${signTestAccessToken()}`;
const createdOwnerIds: string[] = [];

describe("patients", () => {
  let ownerId: string;
  let patientId: string;

  beforeAll(async () => {
    const owner = await prisma.owner.create({
      data: {
        name: "Search Test Owner",
        phone: "5559990001",
        patients: { create: { name: "Searchable Patient", species: "DOG" } },
      },
      include: { patients: true },
    });
    ownerId = owner.id;
    patientId = owner.patients[0]!.id;
    createdOwnerIds.push(ownerId);
  });

  afterAll(async () => {
    await prisma.patient.deleteMany({ where: { ownerId: { in: createdOwnerIds } } });
    await prisma.owner.deleteMany({ where: { id: { in: createdOwnerIds } } });
  });

  it("finds a patient by partial owner phone", async () => {
    const response = await request(app)
      .get("/api/v1/patients?search=99900")
      .set("Authorization", authHeader);

    expect(response.status).toBe(200);
    expect(
      response.body.patients.some((patient: { id: string }) => patient.id === patientId),
    ).toBe(true);
  });

  it("finds a patient by owner name (case-insensitive)", async () => {
    const response = await request(app)
      .get("/api/v1/patients?search=search test owner")
      .set("Authorization", authHeader);

    expect(response.status).toBe(200);
    expect(
      response.body.patients.some((patient: { id: string }) => patient.id === patientId),
    ).toBe(true);
  });

  it("finds a patient by pet name (case-insensitive)", async () => {
    const response = await request(app)
      .get("/api/v1/patients?search=searchable")
      .set("Authorization", authHeader);

    expect(response.status).toBe(200);
    expect(
      response.body.patients.some((patient: { id: string }) => patient.id === patientId),
    ).toBe(true);
  });

  it("creates a standalone patient under an existing owner", async () => {
    const response = await request(app)
      .post("/api/v1/patients")
      .set("Authorization", authHeader)
      .send({ ownerId, name: "Second Pet", species: "CAT" });

    expect(response.status).toBe(201);
    expect(response.body.ownerId).toBe(ownerId);
  });

  it("returns 404 when creating a patient for an unknown owner", async () => {
    const response = await request(app)
      .post("/api/v1/patients")
      .set("Authorization", authHeader)
      .send({ ownerId: "3fa85f64-5717-4562-b3fc-2c963f66afa6", name: "Ghost Pet", species: "CAT" });

    expect(response.status).toBe(404);
  });

  it("updates patient status to soft-archive it (INACTIVE)", async () => {
    const response = await request(app)
      .patch(`/api/v1/patients/${patientId}`)
      .set("Authorization", authHeader)
      .send({ status: "INACTIVE" });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("INACTIVE");
  });

  it("returns 405 for delete attempts (patients are never hard-deleted)", async () => {
    const response = await request(app)
      .delete(`/api/v1/patients/${patientId}`)
      .set("Authorization", authHeader);

    expect(response.status).toBe(405);
  });

  it("returns 404 for an unknown patient id", async () => {
    const response = await request(app)
      .get("/api/v1/patients/3fa85f64-5717-4562-b3fc-2c963f66afa6")
      .set("Authorization", authHeader);

    expect(response.status).toBe(404);
  });
});

describe("GET /patients/:id profile", () => {
  let profilePatientId: string;
  const profileOwnerIds: string[] = [];
  let oldestCaseId: string;
  let middleCaseId: string;
  let newestCaseId: string;

  beforeAll(async () => {
    const owner = await prisma.owner.create({
      data: {
        name: "Profile Test Owner",
        phone: "5559990002",
        patients: { create: { name: "Profile Test Pet", species: "DOG" } },
      },
      include: { patients: true },
    });
    profileOwnerIds.push(owner.id);
    profilePatientId = owner.patients[0]!.id;

    const [oldest, middle, newest] = await Promise.all([
      prisma.case.create({
        data: { patientId: profilePatientId, type: "CONSULTATION", visitDate: new Date("2026-01-01") },
      }),
      prisma.case.create({
        data: { patientId: profilePatientId, type: "CONSULTATION", visitDate: new Date("2026-03-01") },
      }),
      prisma.case.create({
        data: { patientId: profilePatientId, type: "CONSULTATION", visitDate: new Date("2026-05-01") },
      }),
    ]);
    oldestCaseId = oldest.id;
    middleCaseId = middle.id;
    newestCaseId = newest.id;

    await prisma.weightEntry.create({
      data: { patientId: profilePatientId, weightKg: 12.4 },
    });
    await prisma.vaccinationRecord.create({
      data: { patientId: profilePatientId, vaccineName: "DHPPi", doseLabel: "1st dose", givenAt: new Date() },
    });
  });

  afterAll(async () => {
    await prisma.vaccinationRecord.deleteMany({ where: { patientId: profilePatientId } });
    await prisma.weightEntry.deleteMany({ where: { patientId: profilePatientId } });
    await prisma.case.deleteMany({ where: { patientId: profilePatientId } });
    await prisma.patient.deleteMany({ where: { ownerId: { in: profileOwnerIds } } });
    await prisma.owner.deleteMany({ where: { id: { in: profileOwnerIds } } });
  });

  it("returns the timeline ordered newest-first", async () => {
    const response = await request(app)
      .get(`/api/v1/patients/${profilePatientId}`)
      .set("Authorization", authHeader);

    expect(response.status).toBe(200);
    const caseIds = response.body.cases.map((c: { id: string }) => c.id);
    expect(caseIds).toEqual([newestCaseId, middleCaseId, oldestCaseId]);
  });

  it("includes weight and vaccination history", async () => {
    const response = await request(app)
      .get(`/api/v1/patients/${profilePatientId}`)
      .set("Authorization", authHeader);

    expect(response.status).toBe(200);
    expect(response.body.weights).toHaveLength(1);
    expect(Number(response.body.weights[0].weightKg)).toBe(12.4);
    expect(response.body.vaccinations).toHaveLength(1);
    expect(response.body.vaccinations[0].vaccineName).toBe("DHPPi");
  });
});
