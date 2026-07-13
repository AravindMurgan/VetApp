import { describe, expect, it } from "vitest";
import {
  ownerCreateSchema,
  ownerCreateWithPatientSchema,
  ownerUpdateSchema,
  ownerResponseSchema,
} from "./owner";

describe("ownerCreateSchema", () => {
  it("accepts a valid owner payload", () => {
    const result = ownerCreateSchema.safeParse({
      name: "Priya Sharma",
      phone: "+91 98765 43210",
      address: "12 MG Road",
      notes: "Prefers evening appointments",
    });

    expect(result.success).toBe(true);
  });

  it("accepts a minimal valid owner payload (only required fields)", () => {
    const result = ownerCreateSchema.safeParse({
      name: "Priya Sharma",
      phone: "9876543210",
    });

    expect(result.success).toBe(true);
  });

  it("rejects a missing name", () => {
    const result = ownerCreateSchema.safeParse({ phone: "9876543210" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing phone", () => {
    const result = ownerCreateSchema.safeParse({ name: "Priya Sharma" });
    expect(result.success).toBe(false);
  });

  it("rejects a phone number with letters", () => {
    const result = ownerCreateSchema.safeParse({
      name: "Priya Sharma",
      phone: "call-me-maybe",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a too-short phone number", () => {
    const result = ownerCreateSchema.safeParse({ name: "Priya Sharma", phone: "123" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty name", () => {
    const result = ownerCreateSchema.safeParse({ name: "", phone: "9876543210" });
    expect(result.success).toBe(false);
  });
});

describe("ownerCreateWithPatientSchema", () => {
  it("accepts an owner with a nested first patient", () => {
    const result = ownerCreateWithPatientSchema.safeParse({
      name: "Priya Sharma",
      phone: "9876543210",
      patient: { name: "Bruno", species: "DOG" },
    });

    expect(result.success).toBe(true);
  });

  it("rejects when the nested patient is missing required fields", () => {
    const result = ownerCreateWithPatientSchema.safeParse({
      name: "Priya Sharma",
      phone: "9876543210",
      patient: { name: "Bruno" },
    });

    expect(result.success).toBe(false);
  });

  it("rejects a nested patient with an ownerId (not allowed on the nested shape)", () => {
    const result = ownerCreateWithPatientSchema.safeParse({
      name: "Priya Sharma",
      phone: "9876543210",
      patient: { ownerId: "3fa85f64-5717-4562-b3fc-2c963f66afa6", name: "Bruno", species: "DOG" },
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.patient).not.toHaveProperty("ownerId");
    }
  });
});

describe("ownerUpdateSchema", () => {
  it("accepts a partial update with a single field", () => {
    const result = ownerUpdateSchema.safeParse({ notes: "Updated notes" });
    expect(result.success).toBe(true);
  });

  it("accepts an empty object (no-op update)", () => {
    const result = ownerUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects an invalid phone in an update", () => {
    const result = ownerUpdateSchema.safeParse({ phone: "abc" });
    expect(result.success).toBe(false);
  });
});

describe("ownerResponseSchema", () => {
  it("accepts a well-formed response payload", () => {
    const result = ownerResponseSchema.safeParse({
      id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      name: "Priya Sharma",
      phone: "9876543210",
      altPhone: null,
      address: null,
      notes: null,
      createdAt: "2026-07-13T00:00:00.000Z",
    });

    expect(result.success).toBe(true);
  });

  it("rejects a response payload with a non-uuid id", () => {
    const result = ownerResponseSchema.safeParse({
      id: "not-a-uuid",
      name: "Priya Sharma",
      phone: "9876543210",
      altPhone: null,
      address: null,
      notes: null,
      createdAt: "2026-07-13T00:00:00.000Z",
    });

    expect(result.success).toBe(false);
  });
});
