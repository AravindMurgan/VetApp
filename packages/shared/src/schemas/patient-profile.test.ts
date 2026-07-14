import { describe, expect, it } from "vitest";
import { patientProfileResponseSchema } from "./patient-profile";

const VALID_UUID = "3fa85f64-5717-4562-b3fc-2c963f66afa6";

describe("patientProfileResponseSchema", () => {
  it("accepts a full profile with history in all three tabs", () => {
    const result = patientProfileResponseSchema.safeParse({
      id: VALID_UUID,
      ownerId: VALID_UUID,
      name: "Bruno",
      species: "DOG",
      breed: null,
      sex: "UNKNOWN",
      dateOfBirth: null,
      ageIsApprox: false,
      colorMarkings: null,
      microchipId: null,
      status: "ACTIVE",
      createdAt: "2026-07-14T00:00:00.000Z",
      owner: {
        id: VALID_UUID,
        name: "Priya Sharma",
        phone: "9876543210",
        altPhone: null,
        address: null,
        notes: null,
        createdAt: "2026-07-14T00:00:00.000Z",
      },
      cases: [
        {
          id: VALID_UUID,
          patientId: VALID_UUID,
          type: "CONSULTATION",
          status: "OPEN",
          visitDate: "2026-07-14T00:00:00.000Z",
          complaint: null,
          temperatureC: null,
          heartRate: null,
          respRate: null,
          clinicalNotes: null,
          diagnosis: null,
          templateId: null,
          createdAt: "2026-07-14T00:00:00.000Z",
        },
      ],
      weights: [
        {
          id: VALID_UUID,
          patientId: VALID_UUID,
          weightKg: "12.40",
          recordedAt: "2026-07-14T00:00:00.000Z",
          caseId: null,
        },
      ],
      vaccinations: [
        {
          id: VALID_UUID,
          patientId: VALID_UUID,
          vaccineName: "DHPPi",
          doseLabel: "1st dose",
          givenAt: "2026-07-14T00:00:00.000Z",
          batchNo: null,
          nextDueAt: "2026-08-11T00:00:00.000Z",
          caseId: VALID_UUID,
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("accepts a profile with no history yet", () => {
    const result = patientProfileResponseSchema.safeParse({
      id: VALID_UUID,
      ownerId: VALID_UUID,
      name: "Bruno",
      species: "DOG",
      breed: null,
      sex: "UNKNOWN",
      dateOfBirth: null,
      ageIsApprox: false,
      colorMarkings: null,
      microchipId: null,
      status: "ACTIVE",
      createdAt: "2026-07-14T00:00:00.000Z",
      owner: {
        id: VALID_UUID,
        name: "Priya Sharma",
        phone: "9876543210",
        altPhone: null,
        address: null,
        notes: null,
        createdAt: "2026-07-14T00:00:00.000Z",
      },
      cases: [],
      weights: [],
      vaccinations: [],
    });

    expect(result.success).toBe(true);
  });
});
