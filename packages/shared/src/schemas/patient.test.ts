import { describe, expect, it } from "vitest";
import {
  patientCreateSchema,
  patientCreateNestedSchema,
  patientUpdateSchema,
  patientResponseSchema,
} from "./patient";

const VALID_OWNER_ID = "3fa85f64-5717-4562-b3fc-2c963f66afa6";

describe("patientCreateSchema", () => {
  it("accepts a valid patient payload", () => {
    const result = patientCreateSchema.safeParse({
      ownerId: VALID_OWNER_ID,
      name: "Bruno",
      species: "DOG",
      breed: "Labrador",
      dateOfBirth: "2023-01-15",
    });

    expect(result.success).toBe(true);
  });

  it("defaults sex to UNKNOWN and ageIsApprox to false when omitted", () => {
    const result = patientCreateSchema.safeParse({
      ownerId: VALID_OWNER_ID,
      name: "Bruno",
      species: "DOG",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sex).toBe("UNKNOWN");
      expect(result.data.ageIsApprox).toBe(false);
    }
  });

  it("rejects a missing ownerId", () => {
    const result = patientCreateSchema.safeParse({ name: "Bruno", species: "DOG" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing name", () => {
    const result = patientCreateSchema.safeParse({ ownerId: VALID_OWNER_ID, species: "DOG" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing species", () => {
    const result = patientCreateSchema.safeParse({ ownerId: VALID_OWNER_ID, name: "Bruno" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid species", () => {
    const result = patientCreateSchema.safeParse({
      ownerId: VALID_OWNER_ID,
      name: "Bruno",
      species: "DRAGON",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid sex", () => {
    const result = patientCreateSchema.safeParse({
      ownerId: VALID_OWNER_ID,
      name: "Bruno",
      species: "DOG",
      sex: "NONBINARY",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-uuid ownerId", () => {
    const result = patientCreateSchema.safeParse({
      ownerId: "not-a-uuid",
      name: "Bruno",
      species: "DOG",
    });
    expect(result.success).toBe(false);
  });
});

describe("patientCreateNestedSchema", () => {
  it("accepts a valid nested patient payload with no ownerId required", () => {
    const result = patientCreateNestedSchema.safeParse({ name: "Bruno", species: "DOG" });
    expect(result.success).toBe(true);
  });
});

describe("patientUpdateSchema", () => {
  it("accepts a partial update with a single field", () => {
    const result = patientUpdateSchema.safeParse({ status: "DECEASED" });
    expect(result.success).toBe(true);
  });

  it("accepts an empty object (no-op update)", () => {
    const result = patientUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects an invalid status", () => {
    const result = patientUpdateSchema.safeParse({ status: "MISSING" });
    expect(result.success).toBe(false);
  });
});

describe("patientResponseSchema", () => {
  it("accepts a well-formed response payload", () => {
    const result = patientResponseSchema.safeParse({
      id: VALID_OWNER_ID,
      ownerId: VALID_OWNER_ID,
      name: "Bruno",
      species: "DOG",
      breed: null,
      sex: "UNKNOWN",
      dateOfBirth: null,
      ageIsApprox: false,
      colorMarkings: null,
      microchipId: null,
      status: "ACTIVE",
      createdAt: "2026-07-13T00:00:00.000Z",
    });

    expect(result.success).toBe(true);
  });

  it("rejects a response payload with an invalid status", () => {
    const result = patientResponseSchema.safeParse({
      id: VALID_OWNER_ID,
      ownerId: VALID_OWNER_ID,
      name: "Bruno",
      species: "DOG",
      breed: null,
      sex: "UNKNOWN",
      dateOfBirth: null,
      ageIsApprox: false,
      colorMarkings: null,
      microchipId: null,
      status: "ZOMBIE",
      createdAt: "2026-07-13T00:00:00.000Z",
    });

    expect(result.success).toBe(false);
  });
});
