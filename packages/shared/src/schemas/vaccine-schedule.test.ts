import { describe, expect, it } from "vitest";
import {
  doseDefinitionSchema,
  vaccineScheduleResponseSchema,
  vaccineScheduleListResponseSchema,
  vaccineScheduleUpdateSchema,
} from "./vaccine-schedule";

const VALID_UUID = "3fa85f64-5717-4562-b3fc-2c963f66afa6";

describe("doseDefinitionSchema", () => {
  it("accepts an age-based dose", () => {
    expect(doseDefinitionSchema.safeParse({ label: "1st dose", ageWeeks: 7 }).success).toBe(true);
  });

  it("accepts an interval-based dose", () => {
    expect(doseDefinitionSchema.safeParse({ label: "Annual booster", intervalDays: 365 }).success).toBe(
      true,
    );
  });

  it("rejects a missing label", () => {
    expect(doseDefinitionSchema.safeParse({ ageWeeks: 7 }).success).toBe(false);
  });
});

describe("vaccineScheduleResponseSchema", () => {
  it("accepts a well-formed schedule", () => {
    const result = vaccineScheduleResponseSchema.safeParse({
      id: VALID_UUID,
      species: "DOG",
      vaccineName: "DHPPi",
      doses: [
        { label: "1st dose", ageWeeks: 7 },
        { label: "Annual booster", intervalDays: 365 },
      ],
      isPreset: true,
      isActive: true,
    });

    expect(result.success).toBe(true);
  });
});

describe("vaccineScheduleListResponseSchema", () => {
  it("accepts an empty list", () => {
    expect(vaccineScheduleListResponseSchema.safeParse({ vaccineSchedules: [] }).success).toBe(true);
  });
});

describe("vaccineScheduleUpdateSchema", () => {
  it("accepts an isActive-only update", () => {
    expect(vaccineScheduleUpdateSchema.safeParse({ isActive: false }).success).toBe(true);
  });

  it("accepts a doses-only update", () => {
    const result = vaccineScheduleUpdateSchema.safeParse({
      doses: [{ label: "1st dose", ageWeeks: 8 }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty doses array", () => {
    expect(vaccineScheduleUpdateSchema.safeParse({ doses: [] }).success).toBe(false);
  });

  it("accepts an empty object (no-op update)", () => {
    expect(vaccineScheduleUpdateSchema.safeParse({}).success).toBe(true);
  });
});
