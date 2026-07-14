import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../lib/prisma-client";
import { listFollowUpsByBucket, updateFollowUp } from "./follow-up-service";

const TIMEZONE = "Asia/Kolkata";
// now = 2026-07-14T10:00:00Z = 2026-07-14 15:30 IST.
// Asia/Kolkata's "today" window for this instant is:
//   start = 2026-07-13T18:30:00.000Z (2026-07-14 00:00 IST)
//   end   = 2026-07-14T18:30:00.000Z (2026-07-15 00:00 IST)
const NOW = new Date("2026-07-14T10:00:00.000Z");
const START = new Date("2026-07-13T18:30:00.000Z");
const END = new Date("2026-07-14T18:30:00.000Z");

describe("listFollowUpsByBucket boundaries", () => {
  let patientId: string;
  const createdOwnerIds: string[] = [];
  let justBeforeStartId: string;
  let atStartId: string;
  let justBeforeEndId: string;
  let atEndId: string;

  beforeAll(async () => {
    const owner = await prisma.owner.create({
      data: {
        name: "Bucket Boundary Owner",
        phone: "5557770001",
        patients: { create: { name: "Bucket Boundary Pet", species: "DOG" } },
      },
      include: { patients: true },
    });
    createdOwnerIds.push(owner.id);
    patientId = owner.patients[0]!.id;

    const justBeforeStart = new Date(START.getTime() - 1);
    const justBeforeEnd = new Date(END.getTime() - 1);

    const [f1, f2, f3, f4] = await Promise.all([
      prisma.followUp.create({
        data: { patientId, dueDate: justBeforeStart, reason: "RECHECK", status: "PENDING" },
      }),
      prisma.followUp.create({
        data: { patientId, dueDate: START, reason: "RECHECK", status: "PENDING" },
      }),
      prisma.followUp.create({
        data: { patientId, dueDate: justBeforeEnd, reason: "RECHECK", status: "PENDING" },
      }),
      prisma.followUp.create({
        data: { patientId, dueDate: END, reason: "RECHECK", status: "PENDING" },
      }),
    ]);
    justBeforeStartId = f1.id;
    atStartId = f2.id;
    justBeforeEndId = f3.id;
    atEndId = f4.id;
  });

  afterAll(async () => {
    await prisma.followUp.deleteMany({ where: { patientId } });
    await prisma.patient.deleteMany({ where: { ownerId: { in: createdOwnerIds } } });
    await prisma.owner.deleteMany({ where: { id: { in: createdOwnerIds } } });
  });

  it("overdue includes only the follow-up due just before the start boundary", async () => {
    const overdue = await listFollowUpsByBucket("overdue", TIMEZONE, NOW);
    const ids = overdue.map((f) => f.id);

    expect(ids).toContain(justBeforeStartId);
    expect(ids).not.toContain(atStartId);
    expect(ids).not.toContain(justBeforeEndId);
    expect(ids).not.toContain(atEndId);
  });

  it("today includes the follow-up exactly at the start boundary and just before the end boundary", async () => {
    const today = await listFollowUpsByBucket("today", TIMEZONE, NOW);
    const ids = today.map((f) => f.id);

    expect(ids).not.toContain(justBeforeStartId);
    expect(ids).toContain(atStartId);
    expect(ids).toContain(justBeforeEndId);
    expect(ids).not.toContain(atEndId);
  });

  it("upcoming includes only the follow-up exactly at the end boundary", async () => {
    const upcoming = await listFollowUpsByBucket("upcoming", TIMEZONE, NOW);
    const ids = upcoming.map((f) => f.id);

    expect(ids).not.toContain(justBeforeStartId);
    expect(ids).not.toContain(atStartId);
    expect(ids).not.toContain(justBeforeEndId);
    expect(ids).toContain(atEndId);
  });

  it("includes patient and owner details for the call-owner button", async () => {
    const today = await listFollowUpsByBucket("today", TIMEZONE, NOW);
    const match = today.find((f) => f.id === atStartId);

    expect(match?.owner.phone).toBe("5557770001");
    expect(match?.patient.name).toBe("Bucket Boundary Pet");
  });
});

describe("updateFollowUp", () => {
  let patientId: string;
  const createdOwnerIds: string[] = [];

  beforeAll(async () => {
    const owner = await prisma.owner.create({
      data: {
        name: "Follow-up Update Owner",
        phone: "5557770002",
        patients: { create: { name: "Follow-up Update Pet", species: "CAT" } },
      },
      include: { patients: true },
    });
    createdOwnerIds.push(owner.id);
    patientId = owner.patients[0]!.id;
  });

  afterAll(async () => {
    await prisma.followUp.deleteMany({ where: { patientId } });
    await prisma.patient.deleteMany({ where: { ownerId: { in: createdOwnerIds } } });
    await prisma.owner.deleteMany({ where: { id: { in: createdOwnerIds } } });
  });

  it("marks a follow-up done", async () => {
    const followUp = await prisma.followUp.create({
      data: { patientId, dueDate: NOW, reason: "RECHECK", status: "PENDING" },
    });

    const updated = await updateFollowUp(followUp.id, { status: "DONE" });
    expect(updated.status).toBe("DONE");
  });

  it("throws a 404 AppError for an unknown follow-up id", async () => {
    await expect(
      updateFollowUp("3fa85f64-5717-4562-b3fc-2c963f66afa6", { status: "DONE" }),
    ).rejects.toMatchObject({ status: 404, code: "FOLLOW_UP_NOT_FOUND" });
  });
});
