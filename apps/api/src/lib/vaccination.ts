import type { DoseDefinition } from "@vetlog/shared";

const DAYS_PER_WEEK = 7;

function addDays(date: Date, days: number): Date {
  const result = new Date(date.getTime());
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Computes when the next dose is due, given the full dose schedule and which
 * dose was just given.
 *
 * - If the next entry in the schedule is interval-based (e.g. an annual
 *   booster), the next due date is `givenAt + intervalDays`.
 * - If the next entry is age-based (another primary-course dose), the next
 *   due date is `givenAt` plus the age gap between the two doses in weeks —
 *   this sidesteps needing the patient's exact date of birth, since the vet
 *   is dosing off "weeks since last shot," not absolute age.
 * - If there's no next entry (the dose given was the last in the array) but
 *   the dose itself is interval-based (a recurring booster), it recurs:
 *   the next due date is `givenAt + intervalDays` again.
 * - Otherwise (last dose, not interval-based, or the dose label isn't found
 *   in the schedule), there's nothing to schedule.
 */
export function computeNextDueAt(
  doses: DoseDefinition[],
  doseLabel: string,
  givenAt: Date,
): Date | null {
  const currentIndex = doses.findIndex((dose) => dose.label === doseLabel);
  if (currentIndex === -1) {
    return null;
  }

  const currentDose = doses[currentIndex];
  const nextDose = doses[currentIndex + 1];

  if (nextDose) {
    if (nextDose.intervalDays !== undefined) {
      return addDays(givenAt, nextDose.intervalDays);
    }
    if (nextDose.ageWeeks !== undefined && currentDose?.ageWeeks !== undefined) {
      const weeksUntilNext = nextDose.ageWeeks - currentDose.ageWeeks;
      return addDays(givenAt, weeksUntilNext * DAYS_PER_WEEK);
    }
    return null;
  }

  if (currentDose?.intervalDays !== undefined) {
    return addDays(givenAt, currentDose.intervalDays);
  }

  return null;
}
