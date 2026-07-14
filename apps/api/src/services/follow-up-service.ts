import type { FollowUpBucket, FollowUpUpdate } from "@vetlog/shared";
import { prisma } from "../lib/prisma-client";
import { AppError } from "../errors/app-error";
import { isRecordNotFoundError } from "../lib/prisma-errors";
import { getTodayRangeUtc } from "../lib/timezone";
import { joinFollowUpsWithPatientAndOwner } from "../lib/follow-up-join";

export async function listFollowUpsByBucket(
  bucket: FollowUpBucket,
  timeZone: string,
  now: Date = new Date(),
) {
  const { start, end } = getTodayRangeUtc(timeZone, now);

  const dueDateFilter =
    bucket === "overdue"
      ? { lt: start }
      : bucket === "today"
        ? { gte: start, lt: end }
        : { gte: end };

  const followUps = await prisma.followUp.findMany({
    where: { status: "PENDING", dueDate: dueDateFilter },
    orderBy: { dueDate: "asc" },
  });

  return joinFollowUpsWithPatientAndOwner(followUps);
}

export async function updateFollowUp(id: string, input: FollowUpUpdate) {
  try {
    return await prisma.followUp.update({ where: { id }, data: input });
  } catch (error) {
    if (isRecordNotFoundError(error)) {
      throw new AppError(404, "FOLLOW_UP_NOT_FOUND", "Follow-up not found");
    }
    throw error;
  }
}
