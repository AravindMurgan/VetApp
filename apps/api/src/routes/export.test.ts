import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../app";
import { prisma } from "../lib/prisma-client";
import { signTestAccessToken } from "../test-utils/auth";

const app = createApp();
const authHeader = `Bearer ${signTestAccessToken()}`;

describe("GET /export/patients.csv", () => {
  const ownerIds: string[] = [];
  let patientId: string;

  beforeAll(async () => {
    const owner = await prisma.owner.create({
      data: {
        name: "Sharma, Priya",
        phone: "5554440001",
        patients: { create: { name: "Bruno", species: "DOG", breed: "Labrador" } },
      },
      include: { patients: true },
    });
    ownerIds.push(owner.id);
    patientId = owner.patients[0]!.id;

    await prisma.case.create({
      data: { patientId, type: "CONSULTATION", visitDate: new Date("2026-05-01") },
    });
  });

  afterAll(async () => {
    await prisma.case.deleteMany({ where: { patientId } });
    await prisma.patient.deleteMany({ where: { ownerId: { in: ownerIds } } });
    await prisma.owner.deleteMany({ where: { id: { in: ownerIds } } });
  });

  it("rejects requests without a valid access token", async () => {
    const response = await request(app).get("/api/v1/export/patients.csv");
    expect(response.status).toBe(401);
  });

  it("returns a CSV with the expected header and content type", async () => {
    const response = await request(app)
      .get("/api/v1/export/patients.csv")
      .set("Authorization", authHeader);

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("text/csv");
    expect(response.headers["content-disposition"]).toContain("patients.csv");

    const lines = response.text.split("\r\n");
    expect(lines[0]).toBe(
      "Owner Name,Owner Phone,Patient Name,Species,Breed,Status,Last Visit",
    );
  });

  it("escapes an owner name containing a comma and includes the last visit date", async () => {
    const response = await request(app)
      .get("/api/v1/export/patients.csv")
      .set("Authorization", authHeader);

    expect(response.text).toContain('"Sharma, Priya",5554440001,Bruno,DOG,Labrador,ACTIVE,2026-05-01');
  });
});
