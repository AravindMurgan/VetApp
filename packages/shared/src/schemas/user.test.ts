import { describe, expect, it } from "vitest";
import { clinicDetailsUpdateSchema } from "./user";

describe("clinicDetailsUpdateSchema", () => {
  it("accepts a partial update with just one field", () => {
    const result = clinicDetailsUpdateSchema.safeParse({ vetRegistrationNumber: "VET-9981" });
    expect(result.success).toBe(true);
  });

  it("accepts all clinic fields together", () => {
    const result = clinicDetailsUpdateSchema.safeParse({
      clinicName: "VetLog Clinic",
      clinicAddress: "12 Park Street",
      clinicPhone: "5551234567",
      vetRegistrationNumber: "VET-9981",
    });
    expect(result.success).toBe(true);
  });

  it("accepts an empty body (no-op update)", () => {
    const result = clinicDetailsUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects a blank clinic name", () => {
    const result = clinicDetailsUpdateSchema.safeParse({ clinicName: "" });
    expect(result.success).toBe(false);
  });
});
