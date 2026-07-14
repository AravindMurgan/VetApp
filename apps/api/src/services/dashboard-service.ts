import { prisma } from "../lib/prisma-client";
import { getLocalDateString, getTodayRangeUtc } from "../lib/timezone";

export async function getDashboardToday(timeZone: string, now: Date = new Date()) {
  const { start, end } = getTodayRangeUtc(timeZone, now);

  const [casesToday, dueTodayCount, overdueCount] = await Promise.all([
    prisma.case.findMany({
      where: { visitDate: { gte: start, lt: end } },
      include: { patient: true },
      orderBy: { visitDate: "desc" },
    }),
    prisma.followUp.count({
      where: { status: "PENDING", dueDate: { gte: start, lt: end } },
    }),
    prisma.followUp.count({
      where: { status: "PENDING", dueDate: { lt: start } },
    }),
  ]);

  return {
    date: getLocalDateString(timeZone, now),
    casesToday,
    followUpCounts: { dueToday: dueTodayCount, overdue: overdueCount },
  };
}
