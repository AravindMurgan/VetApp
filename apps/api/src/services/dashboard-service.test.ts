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
