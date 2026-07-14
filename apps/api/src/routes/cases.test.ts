import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";
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
    await prisma.vaccinationRecord.deleteMany({ where: { patientId } });
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

  it("rejects a vaccination on a non-VACCINATION case", async () => {
    const response = await request(app)
      .post(`/api/v1/patients/${patientId}/cases`)
      .set("Authorization", authHeader)
      .send({
        type: "CONSULTATION",
        vaccination: { vaccineName: "DHPPi", doseLabel: "1st dose" },
      });

    expect(response.status).toBe(400);
  });

  it("logging a VACCINATION case creates a VaccinationRecord and auto-schedules a VACCINE_DUE follow-up", async () => {
    const response = await request(app)
      .post(`/api/v1/patients/${patientId}/cases`)
      .set("Authorization", authHeader)
      .send({
        type: "VACCINATION",
        vaccination: { vaccineName: "DHPPi", doseLabel: "1st dose", givenAt: "2026-07-14" },
      });

    expect(response.status).toBe(201);

    const vaccinationRecord = await prisma.vaccinationRecord.findFirst({
      where: { caseId: response.body.id },
    });
    expect(vaccinationRecord).not.toBeNull();
    expect(vaccinationRecord?.vaccineName).toBe("DHPPi");
    expect(vaccinationRecord?.doseLabel).toBe("1st dose");
    // DHPPi: 1st dose ageWeeks 7, 2nd dose ageWeeks 11 -> 4 week (28 day) gap.
    expect(vaccinationRecord?.nextDueAt?.toISOString().slice(0, 10)).toBe("2026-08-11");

    const followUp = await prisma.followUp.findFirst({
      where: { caseId: response.body.id, reason: "VACCINE_DUE" },
    });
    expect(followUp).not.toBeNull();
    expect(followUp?.status).toBe("PENDING");
    expect(followUp?.dueDate.toISOString().slice(0, 10)).toBe("2026-08-11");
  });

  it("records a vaccination without a matching schedule, with no auto follow-up", async () => {
    const response = await request(app)
      .post(`/api/v1/patients/${patientId}/cases`)
      .set("Authorization", authHeader)
      .send({
        type: "VACCINATION",
        vaccination: { vaccineName: "Unlisted Vaccine", doseLabel: "1st dose" },
      });

    expect(response.status).toBe(201);

    const vaccinationRecord = await prisma.vaccinationRecord.findFirst({
      where: { caseId: response.body.id },
    });
    expect(vaccinationRecord).not.toBeNull();
    expect(vaccinationRecord?.nextDueAt).toBeNull();

    const followUp = await prisma.followUp.findFirst({
      where: { caseId: response.body.id, reason: "VACCINE_DUE" },
    });
    expect(followUp).toBeNull();
  });
});

describe("GET /cases/:id/prescription", () => {
  const TEST_EMAIL = "prescription-test@vetlog.local";
  const TEST_PASSWORD = "correct-horse-battery-staple";
  const ownerIds: string[] = [];
  let accessToken: string;
  let patientId: string;
  let caseId: string;
  let caseWithRecheckId: string;

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);
    await prisma.user.upsert({
      where: { email: TEST_EMAIL },
      update: {
        passwordHash,
        clinicName: "Prescription Test Clinic",
        clinicAddress: "12 Park Street",
        clinicPhone: "5551234567",
        vetRegistrationNumber: "VET-9981",
      },
      create: {
        email: TEST_EMAIL,
        passwordHash,
        clinicName: "Prescription Test Clinic",
        clinicAddress: "12 Park Street",
        clinicPhone: "5551234567",
        vetRegistrationNumber: "VET-9981",
      },
    });

    const loginResponse = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });
    accessToken = loginResponse.body.accessToken;

    const owner = await prisma.owner.create({
      data: {
        name: "Prescription Test Owner",
        phone: "5558880002",
        patients: { create: { name: "Prescription Test Pet", species: "CAT" } },
      },
      include: { patients: true },
    });
    ownerIds.push(owner.id);
    patientId = owner.patients[0]!.id;

    const createdCase = await prisma.case.create({
      data: {
        patientId,
        type: "CONSULTATION",
        clinicalNotes: "Keep the cone on for 7 days.",
        treatments: {
          create: [
            {
              drugName: "Amoxicillin",
              dose: "50 mg",
              route: "PO",
              frequency: "BID",
              durationDays: 7,
              instructions: "Give with food",
            },
          ],
        },
      },
    });
    caseId = createdCase.id;

    const caseWithRecheck = await prisma.case.create({ data: { patientId, type: "SURGERY" } });
    caseWithRecheckId = caseWithRecheck.id;
    await prisma.followUp.create({
      data: {
        patientId,
        caseId: caseWithRecheckId,
        dueDate: new Date("2026-07-21"),
        reason: "RECHECK",
      },
    });
  });

  afterAll(async () => {
    await prisma.followUp.deleteMany({ where: { patientId } });
    await prisma.treatment.deleteMany({ where: { case: { patientId } } });
    await prisma.case.deleteMany({ where: { patientId } });
    await prisma.patient.deleteMany({ where: { ownerId: { in: ownerIds } } });
    await prisma.owner.deleteMany({ where: { id: { in: ownerIds } } });
    await prisma.user.delete({ where: { email: TEST_EMAIL } }).catch(() => undefined);
  });

  it("returns the case, treatment lines, patient/owner block, and clinic details", async () => {
    const response = await request(app)
      .get(`/api/v1/cases/${caseId}/prescription`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.case.id).toBe(caseId);
    expect(response.body.treatments).toHaveLength(1);
    expect(response.body.treatments[0].drugName).toBe("Amoxicillin");
    expect(response.body.patient.id).toBe(patientId);
    expect(response.body.owner.name).toBe("Prescription Test Owner");
    expect(response.body.clinic).toEqual({
      clinicName: "Prescription Test Clinic",
      clinicAddress: "12 Park Street",
      clinicPhone: "5551234567",
      vetRegistrationNumber: "VET-9981",
    });
    expect(response.body.recheckFollowUp).toBeNull();
  });

  it("includes the recheck follow-up when one is linked to the case", async () => {
    const response = await request(app)
      .get(`/api/v1/cases/${caseWithRecheckId}/prescription`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.recheckFollowUp?.reason).toBe("RECHECK");
    expect(response.body.recheckFollowUp?.dueDate.slice(0, 10)).toBe("2026-07-21");
  });

  it("returns 404 for an unknown case id", async () => {
    const response = await request(app)
      .get("/api/v1/cases/3fa85f64-5717-4562-b3fc-2c963f66afa6/prescription")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(404);
  });

  it("rejects requests without a valid access token", async () => {
    const response = await request(app).get(`/api/v1/cases/${caseId}/prescription`);

    expect(response.status).toBe(401);
  });
});
