import { describe, expect, it } from "vitest";
import { registerRequestSchema } from "./auth";

describe("registerRequestSchema", () => {
  it("accepts a valid registration payload", () => {
    const result = registerRequestSchema.safeParse({
      email: "newvet@vetlog.local",
      password: "long-enough-password",
      clinicName: "VetLog Clinic",
    });

    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = registerRequestSchema.safeParse({
      email: "not-an-email",
      password: "long-enough-password",
      clinicName: "VetLog Clinic",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a too-short password", () => {
    const result = registerRequestSchema.safeParse({
      email: "newvet@vetlog.local",
      password: "short",
      clinicName: "VetLog Clinic",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a missing clinicName", () => {
    const result = registerRequestSchema.safeParse({
      email: "newvet@vetlog.local",
      password: "long-enough-password",
    });

    expect(result.success).toBe(false);
  });
});
