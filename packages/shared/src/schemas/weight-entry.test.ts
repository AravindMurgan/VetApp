import { describe, expect, it } from "vitest";
import { weightEntryCreateNestedSchema, weightEntryResponseSchema } from "./weight-entry";

describe("weightEntryCreateNestedSchema", () => {
  it("accepts a valid weight entry payload", () => {
    const result = weightEntryCreateNestedSchema.safeParse({ weightKg: 4.5 });
    expect(result.success).toBe(true);
  });

  it("coerces a numeric string into a number", () => {
    const result = weightEntryCreateNestedSchema.safeParse({ weightKg: "4.5" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.weightKg).toBe(4.5);
    }
  });

  it("rejects a missing weightKg", () => {
    const result = weightEntryCreateNestedSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects a zero or negative weightKg", () => {
    expect(weightEntryCreateNestedSchema.safeParse({ weightKg: 0 }).success).toBe(false);
    expect(weightEntryCreateNestedSchema.safeParse({ weightKg: -1 }).success).toBe(false);
  });

  it("rejects a weightKg beyond Decimal(5,2) precision", () => {
    const result = weightEntryCreateNestedSchema.safeParse({ weightKg: 1000 });
    expect(result.success).toBe(false);
  });
});

describe("weightEntryResponseSchema", () => {
  it("accepts a well-formed response payload", () => {
    const result = weightEntryResponseSchema.safeParse({
      id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      patientId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      weightKg: "4.50",
      recordedAt: "2026-07-13T00:00:00.000Z",
      caseId: null,
    });

    expect(result.success).toBe(true);
  });
});
