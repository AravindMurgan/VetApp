import { describe, expect, it } from "vitest";
import { treatmentCreateNestedSchema, treatmentResponseSchema, drugNameListResponseSchema } from "./treatment";

describe("treatmentCreateNestedSchema", () => {
  it("accepts a valid treatment payload", () => {
    const result = treatmentCreateNestedSchema.safeParse({
      drugName: "Amoxicillin",
      dose: "250 mg",
      route: "PO",
      frequency: "BID",
      durationDays: 7,
      instructions: "Give with food",
    });

    expect(result.success).toBe(true);
  });

  it("defaults isProcedure to false when omitted", () => {
    const result = treatmentCreateNestedSchema.safeParse({
      drugName: "Amoxicillin",
      dose: "250 mg",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isProcedure).toBe(false);
    }
  });

  it("rejects a missing drugName", () => {
    const result = treatmentCreateNestedSchema.safeParse({ dose: "250 mg" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing dose", () => {
    const result = treatmentCreateNestedSchema.safeParse({ drugName: "Amoxicillin" });
    expect(result.success).toBe(false);
  });

  it("rejects a non-positive durationDays", () => {
    const result = treatmentCreateNestedSchema.safeParse({
      drugName: "Amoxicillin",
      dose: "250 mg",
      durationDays: 0,
    });
    expect(result.success).toBe(false);
  });
});

describe("treatmentResponseSchema", () => {
  it("accepts a well-formed response payload", () => {
    const result = treatmentResponseSchema.safeParse({
      id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      caseId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      drugName: "Amoxicillin",
      dose: "250 mg",
      route: null,
      frequency: null,
      durationDays: null,
      instructions: null,
      isProcedure: false,
    });

    expect(result.success).toBe(true);
  });
});

describe("drugNameListResponseSchema", () => {
  it("accepts a list of drug names", () => {
    const result = drugNameListResponseSchema.safeParse({ drugNames: ["Amoxicillin", "Meloxicam"] });
    expect(result.success).toBe(true);
  });

  it("accepts an empty list", () => {
    const result = drugNameListResponseSchema.safeParse({ drugNames: [] });
    expect(result.success).toBe(true);
  });
});
