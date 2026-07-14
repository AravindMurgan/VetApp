import { prisma } from "../lib/prisma-client";
import { getLocalDateString, getTodayRangeUtc } from "../lib/timezone";
import { joinFollowUpsWithPatientAndOwner } from "../lib/follow-up-join";

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

  const followUpsDueToday = await joinFollowUpsWithPatientAndOwner(followUpsDueTodayRaw);

  return {
    date: getLocalDateString(timeZone, now),
    casesToday,
    followUpsDueToday,
    followUpCounts: { dueToday: followUpsDueToday.length, overdue: overdueCount },
  };
}
