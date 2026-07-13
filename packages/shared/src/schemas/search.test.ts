import { describe, expect, it } from "vitest";
import { patientListResponseSchema } from "./search";

describe("patientListResponseSchema", () => {
  it("accepts a list of patients with embedded owner info", () => {
    const result = patientListResponseSchema.safeParse({
      patients: [
        {
          id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          ownerId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
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
          owner: {
            id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            name: "Priya Sharma",
            phone: "9876543210",
          },
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("accepts an empty list", () => {
    const result = patientListResponseSchema.safeParse({ patients: [] });
    expect(result.success).toBe(true);
  });

  it("rejects a list entry missing the owner", () => {
    const result = patientListResponseSchema.safeParse({
      patients: [
        {
          id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          ownerId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
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
        },
      ],
    });

    expect(result.success).toBe(false);
  });
});
