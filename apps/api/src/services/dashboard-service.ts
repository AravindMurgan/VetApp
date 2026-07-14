import { prisma } from "../lib/prisma-client";
import { getLocalDateString, getTodayRangeUtc } from "../lib/timezone";

export async function getDashboardToday(timeZone: string, now: Date = new Date()) {
  const { start, end } = getTodayRangeUtc(timeZone, now);

  const [casesToday, followUpsDueTodayRaw, overdueCount] = await Promise.all([
    prisma.case.findMany({
      where: { visitDate: { gte: start, lt: end } },
      include: { patient: true },
      orderBy: { visitDate: "desc" },
    }),
    prisma.followUp.findMany({
      where: { status: "PENDING", dueDate: { gte: start, lt: end } },
      orderBy: { dueDate: "asc" },
    }),
    prisma.followUp.count({
      where: { status: "PENDING", dueDate: { lt: start } },
    }),
  ]);

  // FollowUp only carries a denormalized patientId (no Prisma relation to
  // Patient), so the patient/owner join has to happen manually here.
  const patientIds = [...new Set(followUpsDueTodayRaw.map((followUp) => followUp.patientId))];
  const patients = await prisma.patient.findMany({
    where: { id: { in: patientIds } },
    include: { owner: true },
  });
  const patientById = new Map(patients.map((patient) => [patient.id, patient]));

  const followUpsDueToday = followUpsDueTodayRaw.flatMap((followUp) => {
    const patient = patientById.get(followUp.patientId);
    if (!patient) {
      return [];
    }
    const { owner, ...patientFields } = patient;
    return [{ ...followUp, patient: patientFields, owner }];
  });

  return {
    date: getLocalDateString(timeZone, now),
    casesToday,
    followUpsDueToday,
    followUpCounts: { dueToday: followUpsDueToday.length, overdue: overdueCount },
  };
}
