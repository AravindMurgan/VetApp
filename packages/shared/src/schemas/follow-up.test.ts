import { describe, expect, it } from "vitest";
import { followUpCreateNestedSchema, followUpResponseSchema } from "./follow-up";

describe("followUpCreateNestedSchema", () => {
  it("accepts a valid follow-up payload", () => {
    const result = followUpCreateNestedSchema.safeParse({
      dueDate: "2026-07-20",
      reason: "VACCINE_DUE",
      notes: "Second dose due",
    });

    expect(result.success).toBe(true);
  });

  it("accepts a payload without optional notes", () => {
    const result = followUpCreateNestedSchema.safeParse({
      dueDate: "2026-07-20",
      reason: "RECHECK",
    });

    expect(result.success).toBe(true);
  });

  it("rejects a missing dueDate", () => {
    const result = followUpCreateNestedSchema.safeParse({ reason: "RECHECK" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing reason", () => {
    const result = followUpCreateNestedSchema.safeParse({ dueDate: "2026-07-20" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid reason", () => {
    const result = followUpCreateNestedSchema.safeParse({
      dueDate: "2026-07-20",
      reason: "BECAUSE_I_SAID_SO",
    });
    expect(result.success).toBe(false);
  });
});

describe("followUpResponseSchema", () => {
  it("accepts a well-formed response payload", () => {
    const result = followUpResponseSchema.safeParse({
      id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      caseId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      patientId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      dueDate: "2026-07-20T00:00:00.000Z",
      reason: "VACCINE_DUE",
      notes: null,
      status: "PENDING",
    });

    expect(result.success).toBe(true);
  });

  it("rejects an invalid status", () => {
    const result = followUpResponseSchema.safeParse({
      id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      caseId: null,
      patientId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      dueDate: "2026-07-20T00:00:00.000Z",
      reason: "VACCINE_DUE",
      notes: null,
      status: "SNOOZED",
    });

    expect(result.success).toBe(false);
  });
});
