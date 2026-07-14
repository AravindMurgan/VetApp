import { describe, expect, it } from "vitest";
import { caseTemplateResponseSchema, caseTemplateListResponseSchema } from "./case-template";

const VALID_UUID = "3fa85f64-5717-4562-b3fc-2c963f66afa6";

describe("caseTemplateResponseSchema", () => {
  it("accepts a well-formed template with treatment lines and a follow-up interval", () => {
    const result = caseTemplateResponseSchema.safeParse({
      id: VALID_UUID,
      name: "Tick fever workup",
      caseType: "CONSULTATION",
      species: "DOG",
      defaults: {
        complaint: "Lethargy, suspected tick fever",
        diagnosis: "Ehrlichiosis / Babesiosis (suspected)",
        treatmentLines: [{ drugName: "Doxycycline", dose: "5 mg/kg", route: "PO", frequency: "BID" }],
        followUpDays: 3,
      },
      isActive: true,
    });

    expect(result.success).toBe(true);
  });

  it("accepts a template with a null species (applies to any) and null followUpDays", () => {
    const result = caseTemplateResponseSchema.safeParse({
      id: VALID_UUID,
      name: "Deworming",
      caseType: "CONSULTATION",
      species: null,
      defaults: {
        complaint: "Routine deworming",
        treatmentLines: [{ drugName: "Fenbendazole", dose: "per label", route: "PO" }],
        followUpDays: null,
      },
      isActive: true,
    });

    expect(result.success).toBe(true);
  });

  it("rejects an invalid caseType", () => {
    const result = caseTemplateResponseSchema.safeParse({
      id: VALID_UUID,
      name: "Bogus",
      caseType: "ROUTINE_CHECKUP",
      species: null,
      defaults: { treatmentLines: [], followUpDays: null },
      isActive: true,
    });

    expect(result.success).toBe(false);
  });
});

describe("caseTemplateListResponseSchema", () => {
  it("accepts an empty list", () => {
    const result = caseTemplateListResponseSchema.safeParse({ templates: [] });
    expect(result.success).toBe(true);
  });
});
