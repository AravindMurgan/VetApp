import { describe, expect, it } from "vitest";
import { computeNextDueAt } from "./vaccination";

// Mirrors the real seeded DHPPi schedule (prisma/seed.ts).
const DHPPI_DOSES = [
  { label: "1st dose", ageWeeks: 7 },
  { label: "2nd dose", ageWeeks: 11 },
  { label: "3rd dose", ageWeeks: 15 },
  { label: "Annual booster", intervalDays: 365 },
];

describe("computeNextDueAt", () => {
  it("computes the primary-course interval between two age-based doses (1st -> 2nd)", () => {
    const givenAt = new Date("2026-01-01T00:00:00.000Z");
    const nextDueAt = computeNextDueAt(DHPPI_DOSES, "1st dose", givenAt);

    // 2nd dose is at ageWeeks 11 vs 1st dose's 7 -> 4 week (28 day) gap.
    expect(nextDueAt?.toISOString()).toBe("2026-01-29T00:00:00.000Z");
  });

  it("computes the primary-course interval between two age-based doses (2nd -> 3rd)", () => {
    const givenAt = new Date("2026-01-01T00:00:00.000Z");
    const nextDueAt = computeNextDueAt(DHPPI_DOSES, "2nd dose", givenAt);

    // 3rd dose is at ageWeeks 15 vs 2nd dose's 11 -> 4 week (28 day) gap.
    expect(nextDueAt?.toISOString()).toBe("2026-01-29T00:00:00.000Z");
  });

  it("schedules the first booster when the final primary-course dose is given", () => {
    const givenAt = new Date("2026-01-01T00:00:00.000Z");
    const nextDueAt = computeNextDueAt(DHPPI_DOSES, "3rd dose", givenAt);

    // Next entry after "3rd dose" is the interval-based Annual booster.
    expect(nextDueAt?.toISOString()).toBe("2027-01-01T00:00:00.000Z");
  });

  it("re-schedules itself one interval later when an annual booster is given", () => {
    const givenAt = new Date("2026-01-01T00:00:00.000Z");
    const nextDueAt = computeNextDueAt(DHPPI_DOSES, "Annual booster", givenAt);

    // "Annual booster" is the last entry with no "next" — it recurs on its own interval.
    expect(nextDueAt?.toISOString()).toBe("2027-01-01T00:00:00.000Z");
  });

  it("returns null for a dose label not present in the schedule", () => {
    const nextDueAt = computeNextDueAt(DHPPI_DOSES, "4th dose", new Date("2026-01-01T00:00:00.000Z"));
    expect(nextDueAt).toBeNull();
  });

  it("returns null for a final dose with no interval to recur on", () => {
    const singleDoseSchedule = [{ label: "Only dose", ageWeeks: 6 }];
    const nextDueAt = computeNextDueAt(singleDoseSchedule, "Only dose", new Date("2026-01-01T00:00:00.000Z"));
    expect(nextDueAt).toBeNull();
  });

  it("returns null when neither dose in the pair carries ageWeeks or intervalDays", () => {
    const malformedSchedule = [{ label: "1st dose" }, { label: "2nd dose" }];
    const nextDueAt = computeNextDueAt(malformedSchedule, "1st dose", new Date("2026-01-01T00:00:00.000Z"));
    expect(nextDueAt).toBeNull();
  });
});
