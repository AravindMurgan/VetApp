import { describe, expect, it } from "vitest";
import { vaccinationCreateNestedSchema, vaccinationRecordResponseSchema } from "./vaccination-record";

const VALID_UUID = "3fa85f64-5717-4562-b3fc-2c963f66afa6";

describe("vaccinationCreateNestedSchema", () => {
  it("accepts a valid payload", () => {
    const result = vaccinationCreateNestedSchema.safeParse({
      vaccineName: "DHPPi",
      doseLabel: "1st dose",
      batchNo: "B12345",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a missing vaccineName", () => {
    expect(vaccinationCreateNestedSchema.safeParse({ doseLabel: "1st dose" }).success).toBe(false);
  });

  it("rejects a missing doseLabel", () => {
    expect(vaccinationCreateNestedSchema.safeParse({ vaccineName: "DHPPi" }).success).toBe(false);
  });
});

describe("vaccinationRecordResponseSchema", () => {
  it("accepts a well-formed response payload", () => {
    const result = vaccinationRecordResponseSchema.safeParse({
      id: VALID_UUID,
      patientId: VALID_UUID,
      vaccineName: "DHPPi",
      doseLabel: "1st dose",
      givenAt: "2026-07-14T00:00:00.000Z",
      batchNo: null,
      nextDueAt: "2026-08-11T00:00:00.000Z",
      caseId: VALID_UUID,
    });
    expect(result.success).toBe(true);
  });
});
