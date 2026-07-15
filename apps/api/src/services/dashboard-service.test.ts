import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../lib/prisma-client";
import { getDashboardToday } from "./dashboard-service";

const createdOwnerIds: string[] = [];

describe("getDashboardToday timezone boundary", () => {
  let patientId: string;
  let boundaryCaseId: string;

  beforeAll(async () => {
    const owner = await prisma.owner.create({
      data: {
        name: "Timezone Test Owner",
        phone: "5556660001",
        patients: { create: { name: "Timezone Test Pet", species: "DOG" } },
      },
      include: { patients: true },
    });
    createdOwnerIds.push(owner.id);
    patientId = owner.patients[0]!.id;

    // 2026-07-13T18:15:00Z is 23:45 IST on Jul 13 (already "yesterday" relative
    // to a `now` of 2026-07-13T19:00:00Z, which is 00:30 IST on Jul 14) but is
    // 19:15 BST on Jul 13 (still "today" relative to that same `now`, which is
    // 20:00 BST on Jul 13). Same UTC instant, two different local calendar days.
    const boundaryCase = await prisma.case.create({
      data: {
        patientId,
        type: "CONSULTATION",
        visitDate: new Date("2026-07-13T18:15:00.000Z"),
      },
    });
    boundaryCaseId = boundaryCase.id;
  });

  afterAll(async () => {
    await prisma.case.deleteMany({ where: { patientId } });
    await prisma.patient.deleteMany({ where: { ownerId: { in: createdOwnerIds } } });
    await prisma.owner.deleteMany({ where: { id: { in: createdOwnerIds } } });
  });

  it("excludes the boundary case from Asia/Kolkata's today but includes it in Europe/London's", async () => {
    const now = new Date("2026-07-13T19:00:00.000Z");

    const kolkata = await getDashboardToday("Asia/Kolkata", now);
    const london = await getDashboardToday("Europe/London", now);

    expect(kolkata.casesToday.some((c) => c.id === boundaryCaseId)).toBe(false);
    expect(london.casesToday.some((c) => c.id === boundaryCaseId)).toBe(true);
  });

  it("reports the correct local date string per timezone", async () => {
    const now = new Date("2026-07-13T19:00:00.000Z");

    const kolkata = await getDashboardToday("Asia/Kolkata", now);
    const london = await getDashboardToday("Europe/London", now);

    expect(kolkata.date).toBe("2026-07-14");
    expect(london.date).toBe("2026-07-13");
  });
});

describe("getDashboardToday due-today follow-ups", () => {
  const createdIds: string[] = [];

  afterAll(async () => {
    await prisma.followUp.deleteMany({ where: { patientId: { in: createdIds } } });
    await prisma.patient.deleteMany({ where: { ownerId: { in: createdIds } } });
    await prisma.owner.deleteMany({ where: { id: { in: createdIds } } });
  });

  it("includes the owner's phone number for a call-owner button", async () => {
    const owner = await prisma.owner.create({
      data: {
        name: "Follow-up Test Owner",
        phone: "5556660002",
        patients: { create: { name: "Follow-up Test Pet", species: "CAT" } },
      },
      include: { patients: true },
    });
    createdIds.push(owner.id);
    const patientId = owner.patients[0]!.id;

    const now = new Date("2026-07-13T10:00:00.000Z");
    await prisma.followUp.create({
      data: {
        patientId,
        dueDate: now,
        reason: "RECHECK",
        status: "PENDING",
      },
    });

    const result = await getDashboardToday("Asia/Kolkata", now);
    const match = result.followUpsDueToday.find((f) => f.patientId === patientId);

    expect(match).toBeDefined();
    expect(match?.owner.phone).toBe("5556660002");
    expect(match?.patient.name).toBe("Follow-up Test Pet");
  });
});

describe("getDashboardToday weight join", () => {
  const createdOwnerIds: string[] = [];

  afterAll(async () => {
    await prisma.weightEntry.deleteMany({ where: { patient: { ownerId: { in: createdOwnerIds } } } });
    await prisma.case.deleteMany({ where: { patient: { ownerId: { in: createdOwnerIds } } } });
    await prisma.patient.deleteMany({ where: { ownerId: { in: createdOwnerIds } } });
    await prisma.owner.deleteMany({ where: { id: { in: createdOwnerIds } } });
  });

  it("attaches the case's weight entry, keyed by caseId", async () => {
    const owner = await prisma.owner.create({
      data: {
        name: "Weight Join Owner",
        phone: "5556660003",
        patients: { create: { name: "Weight Join Pet", species: "DOG" } },
      },
      include: { patients: true },
    });
    createdOwnerIds.push(owner.id);
    const patientId = owner.patients[0]!.id;

    const now = new Date("2026-07-13T10:00:00.000Z");
    const withWeight = await prisma.case.create({
      data: { patientId, type: "CONSULTATION", visitDate: now },
    });
    const withoutWeight = await prisma.case.create({
      data: { patientId, type: "CONSULTATION", visitDate: now },
    });
    await prisma.weightEntry.create({
      data: { patientId, caseId: withWeight.id, weightKg: 12.4, recordedAt: now },
    });

    const result = await getDashboardToday("Asia/Kolkata", now);

    const weightKg = result.casesToday.find((c) => c.id === withWeight.id)?.weightKg;
    expect(Number(weightKg)).toBe(12.4);
    expect(result.casesToday.find((c) => c.id === withoutWeight.id)?.weightKg).toBeNull();
  });
});
