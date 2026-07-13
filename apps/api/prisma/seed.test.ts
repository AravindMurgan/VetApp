import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../src/lib/prisma-client";
import { seed, VACCINE_SCHEDULES, CASE_TEMPLATES } from "./seed";

describe("seed", () => {
  beforeAll(async () => {
    await seed();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("is idempotent — running twice does not duplicate rows", async () => {
    await seed();

    const vaccineScheduleCount = await prisma.vaccineSchedule.count();
    const caseTemplateCount = await prisma.caseTemplate.count();

    expect(vaccineScheduleCount).toBe(VACCINE_SCHEDULES.length);
    expect(caseTemplateCount).toBe(CASE_TEMPLATES.length);
  });

  it("seeds the dev user exactly once", async () => {
    const devUser = await prisma.user.findUnique({ where: { email: "dev@vetlog.local" } });
    expect(devUser).not.toBeNull();
    expect(devUser?.clinicName).toBe("VetLog Dev Clinic");

    const usersWithDevEmail = await prisma.user.count({ where: { email: "dev@vetlog.local" } });
    expect(usersWithDevEmail).toBe(1);
  });

  it("seeds dog and cat vaccine schedules from SPEC §5", async () => {
    const dogSchedules = await prisma.vaccineSchedule.findMany({ where: { species: "DOG" } });
    const catSchedules = await prisma.vaccineSchedule.findMany({ where: { species: "CAT" } });

    expect(dogSchedules.map((s) => s.vaccineName).sort()).toEqual(
      ["DHPPi", "Kennel cough", "Rabies"].sort(),
    );
    expect(catSchedules.map((s) => s.vaccineName).sort()).toEqual(
      ["Rabies", "Tricat/FVRCP"].sort(),
    );
  });

  it("seeds 10 case templates from SPEC §6", async () => {
    const count = await prisma.caseTemplate.count();
    expect(count).toBe(10);
  });
});
