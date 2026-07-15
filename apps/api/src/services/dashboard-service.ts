import { prisma } from "../lib/prisma-client";
import { getLocalDateString, getTodayRangeUtc } from "../lib/timezone";
import { joinFollowUpsWithPatientAndOwner } from "../lib/follow-up-join";

export async function getDashboardToday(timeZone: string, now: Date = new Date()) {
  const { start, end } = getTodayRangeUtc(timeZone, now);

  const [casesTodayRaw, followUpsDueTodayRaw, overdueCount] = await Promise.all([
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

  const followUpsDueToday = await joinFollowUpsWithPatientAndOwner(followUpsDueTodayRaw);
  const casesToday = await joinCasesWithWeight(casesTodayRaw);

  return {
    date: getLocalDateString(timeZone, now),
    casesToday,
    followUpsDueToday,
    followUpCounts: { dueToday: followUpsDueToday.length, overdue: overdueCount },
  };
}

/**
 * WeightEntry only carries a denormalized caseId (no Prisma relation to
 * Case), so the case -> weight join has to happen manually. A case only
 * ever gets one weight entry through the New Case flow, but if more than
 * one exists, the most recent wins.
 */
async function joinCasesWithWeight<T extends { id: string }>(
  cases: T[],
): Promise<(T & { weightKg: string | null })[]> {
  const caseIds = cases.map((c) => c.id);
  const weightEntries = await prisma.weightEntry.findMany({
    where: { caseId: { in: caseIds } },
    orderBy: { recordedAt: "desc" },
  });
  const weightByCaseId = new Map<string, string>();
  for (const entry of weightEntries) {
    if (entry.caseId && !weightByCaseId.has(entry.caseId)) {
      weightByCaseId.set(entry.caseId, entry.weightKg.toString());
    }
  }

  return cases.map((c) => ({ ...c, weightKg: weightByCaseId.get(c.id) ?? null }));
}
