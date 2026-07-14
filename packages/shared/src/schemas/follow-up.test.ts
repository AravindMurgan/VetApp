import { describe, expect, it } from "vitest";
import {
  followUpCreateNestedSchema,
  followUpResponseSchema,
  followUpUpdateSchema,
  followUpBucketSchema,
  followUpSummaryResponseSchema,
  followUpListResponseSchema,
} from "./follow-up";

const VALID_UUID = "3fa85f64-5717-4562-b3fc-2c963f66afa6";

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

describe("followUpUpdateSchema", () => {
  it("accepts a status-only update", () => {
    const result = followUpUpdateSchema.safeParse({ status: "DONE" });
    expect(result.success).toBe(true);
  });

  it("accepts an empty object (no-op update)", () => {
    const result = followUpUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects an invalid status", () => {
    const result = followUpUpdateSchema.safeParse({ status: "SNOOZED" });
    expect(result.success).toBe(false);
  });
});

describe("followUpBucketSchema", () => {
  it("accepts overdue, today, and upcoming", () => {
    expect(followUpBucketSchema.safeParse("overdue").success).toBe(true);
    expect(followUpBucketSchema.safeParse("today").success).toBe(true);
    expect(followUpBucketSchema.safeParse("upcoming").success).toBe(true);
  });

  it("rejects an unknown bucket", () => {
    expect(followUpBucketSchema.safeParse("someday").success).toBe(false);
  });
});

describe("followUpSummaryResponseSchema and followUpListResponseSchema", () => {
  const validSummary = {
    id: VALID_UUID,
    caseId: null,
    patientId: VALID_UUID,
    dueDate: "2026-07-20T00:00:00.000Z",
    reason: "VACCINE_DUE",
    notes: null,
    status: "PENDING",
    patient: { id: VALID_UUID, name: "Bruno", species: "DOG" },
    owner: { id: VALID_UUID, name: "Priya Sharma", phone: "9876543210" },
  };

  it("accepts a well-formed follow-up summary with patient and owner", () => {
    expect(followUpSummaryResponseSchema.safeParse(validSummary).success).toBe(true);
  });

  it("accepts a list response wrapping summaries", () => {
    const result = followUpListResponseSchema.safeParse({ followUps: [validSummary] });
    expect(result.success).toBe(true);
  });

  it("accepts an empty list", () => {
    const result = followUpListResponseSchema.safeParse({ followUps: [] });
    expect(result.success).toBe(true);
  });
});
