import { describe, expect, it } from "vitest";
import {
  caseCreateSchema,
  caseUpdateSchema,
  caseResponseSchema,
  caseWithDetailsResponseSchema,
} from "./case";

const VALID_UUID = "3fa85f64-5717-4562-b3fc-2c963f66afa6";

describe("caseCreateSchema", () => {
  it("round-trips a fully nested create payload (treatments, weight entry, follow-up)", () => {
    const result = caseCreateSchema.safeParse({
      type: "VACCINATION",
      complaint: "Scheduled vaccination",
      temperatureC: 38.5,
      heartRate: 110,
      respRate: 24,
      clinicalNotes: "Bright, alert, responsive",
      diagnosis: "Healthy",
      treatments: [
        { drugName: "Rabies vaccine", dose: "1 ml", route: "SC" },
        { drugName: "Deworming tablet", dose: "1 tablet", isProcedure: true },
      ],
      weightEntry: { weightKg: 12.4 },
      followUp: { dueDate: "2027-07-13", reason: "VACCINE_DUE", notes: "Annual booster" },
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.type).toBe("VACCINATION");
    expect(result.data.treatments).toHaveLength(2);
    expect(result.data.treatments[0]).toMatchObject({ drugName: "Rabies vaccine", dose: "1 ml", route: "SC" });
    expect(result.data.treatments[0]?.isProcedure).toBe(false);
    expect(result.data.treatments[1]?.isProcedure).toBe(true);
    expect(result.data.weightEntry).toEqual({ weightKg: 12.4 });
    expect(result.data.followUp?.reason).toBe("VACCINE_DUE");
    expect(result.data.followUp?.dueDate).toBeInstanceOf(Date);
  });

  it("accepts a minimal payload with only the required type field", () => {
    const result = caseCreateSchema.safeParse({ type: "CONSULTATION" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.treatments).toEqual([]);
      expect(result.data.weightEntry).toBeUndefined();
      expect(result.data.followUp).toBeUndefined();
    }
  });

  it("rejects a missing type", () => {
    const result = caseCreateSchema.safeParse({ complaint: "Vomiting" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid case type", () => {
    const result = caseCreateSchema.safeParse({ type: "ROUTINE_CHECKUP" });
    expect(result.success).toBe(false);
  });

  it("rejects a nested treatment missing required fields", () => {
    const result = caseCreateSchema.safeParse({
      type: "CONSULTATION",
      treatments: [{ drugName: "Amoxicillin" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a nested follow-up with an invalid reason", () => {
    const result = caseCreateSchema.safeParse({
      type: "CONSULTATION",
      followUp: { dueDate: "2026-07-20", reason: "JUST_BECAUSE" },
    });
    expect(result.success).toBe(false);
  });
});

describe("caseUpdateSchema", () => {
  it("accepts a partial update", () => {
    const result = caseUpdateSchema.safeParse({ status: "CLOSED" });
    expect(result.success).toBe(true);
  });

  it("accepts an empty object (no-op update)", () => {
    const result = caseUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects an invalid status", () => {
    const result = caseUpdateSchema.safeParse({ status: "ARCHIVED" });
    expect(result.success).toBe(false);
  });
});

describe("caseResponseSchema", () => {
  it("accepts a well-formed response payload", () => {
    const result = caseResponseSchema.safeParse({
      id: VALID_UUID,
      patientId: VALID_UUID,
      type: "CONSULTATION",
      status: "OPEN",
      visitDate: "2026-07-13T00:00:00.000Z",
      complaint: "Vomiting",
      temperatureC: "38.5",
      heartRate: 110,
      respRate: 24,
      clinicalNotes: null,
      diagnosis: null,
      templateId: null,
      createdAt: "2026-07-13T00:00:00.000Z",
    });

    expect(result.success).toBe(true);
  });
});

describe("caseWithDetailsResponseSchema", () => {
  it("accepts a case response with nested treatments and follow-ups", () => {
    const result = caseWithDetailsResponseSchema.safeParse({
      id: VALID_UUID,
      patientId: VALID_UUID,
      type: "VACCINATION",
      status: "OPEN",
      visitDate: "2026-07-13T00:00:00.000Z",
      complaint: null,
      temperatureC: null,
      heartRate: null,
      respRate: null,
      clinicalNotes: null,
      diagnosis: null,
      templateId: null,
      createdAt: "2026-07-13T00:00:00.000Z",
      treatments: [
        {
          id: VALID_UUID,
          caseId: VALID_UUID,
          drugName: "Rabies vaccine",
          dose: "1 ml",
          route: null,
          frequency: null,
          durationDays: null,
          instructions: null,
          isProcedure: false,
        },
      ],
      followUps: [
        {
          id: VALID_UUID,
          caseId: VALID_UUID,
          patientId: VALID_UUID,
          dueDate: "2027-07-13T00:00:00.000Z",
          reason: "VACCINE_DUE",
          notes: null,
          status: "PENDING",
        },
      ],
    });

    expect(result.success).toBe(true);
  });
});
