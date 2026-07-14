import type { Species } from "@prisma/client";
import type { VaccineScheduleUpdate } from "@vetlog/shared";
import { prisma } from "../lib/prisma-client";
import { AppError } from "../errors/app-error";
import { isRecordNotFoundError } from "../lib/prisma-errors";

export interface ListVaccineSchedulesOptions {
  species?: Species;
  /** The New Case vaccine picker only wants active schedules; the schedule editor wants all of them, so it can re-enable a disabled one. */
  activeOnly?: boolean;
}

export async function listVaccineSchedules(options: ListVaccineSchedulesOptions = {}) {
  return prisma.vaccineSchedule.findMany({
    where: {
      ...(options.activeOnly ? { isActive: true } : {}),
      ...(options.species ? { species: options.species } : {}),
    },
    orderBy: [{ species: "asc" }, { vaccineName: "asc" }],
  });
}

export async function updateVaccineSchedule(id: string, input: VaccineScheduleUpdate) {
  try {
    return await prisma.vaccineSchedule.update({ where: { id }, data: input });
  } catch (error) {
    if (isRecordNotFoundError(error)) {
      throw new AppError(404, "VACCINE_SCHEDULE_NOT_FOUND", "Vaccine schedule not found");
    }
    throw error;
  }
}
