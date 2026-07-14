import { describe, expect, it } from "vitest";
import { casePrescriptionResponseSchema } from "./case-prescription";

const VALID_UUID = "3fa85f64-5717-4562-b3fc-2c963f66afa6";

function validCasePrescription(overrides: Record<string, unknown> = {}) {
  return {
    case: {
      id: VALID_UUID,
      patientId: VALID_UUID,
      type: "CONSULTATION",
      status: "OPEN",
      visitDate: "2026-07-14T00:00:00.000Z",
      complaint: "Vomiting",
      temperatureC: null,
      heartRate: null,
      respRate: null,
      clinicalNotes: "Recheck if symptoms persist beyond 3 days.",
      diagnosis: "Gastritis",
      templateId: null,
      createdAt: "2026-07-14T00:00:00.000Z",
    },
    treatments: [
      {
        id: VALID_UUID,
        caseId: VALID_UUID,
        drugName: "Metronidazole",
        dose: "50 mg",
        route: "PO",
        frequency: "BID",
        durationDays: 5,
        instructions: "Give with food",
        isProcedure: false,
      },
    ],
    recheckFollowUp: null,
    patient: {
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
    },
    owner: {
      id: VALID_UUID,
      name: "Priya Sharma",
      phone: "9876543210",
      altPhone: null,
      address: null,
      notes: null,
      createdAt: "2026-07-14T00:00:00.000Z",
    },
    clinic: {
      clinicName: "VetLog Clinic",
      clinicAddress: null,
      clinicPhone: null,
      vetRegistrationNumber: null,
    },
    ...overrides,
  };
}

describe("casePrescriptionResponseSchema", () => {
  it("accepts a full prescription with treatments and clinic details", () => {
    const result = casePrescriptionResponseSchema.safeParse(
      validCasePrescription({
        clinic: {
          clinicName: "VetLog Clinic",
          clinicAddress: "12 Park Street",
          clinicPhone: "5551234567",
          vetRegistrationNumber: "VET-9981",
        },
      }),
    );

    expect(result.success).toBe(true);
  });

  it("accepts a recheck follow-up when one is linked to the case", () => {
    const result = casePrescriptionResponseSchema.safeParse(
      validCasePrescription({
        recheckFollowUp: {
          id: VALID_UUID,
          caseId: VALID_UUID,
          patientId: VALID_UUID,
          dueDate: "2026-07-21T00:00:00.000Z",
          reason: "RECHECK",
          notes: null,
          status: "PENDING",
        },
      }),
    );

    expect(result.success).toBe(true);
  });

  it("rejects a prescription missing the clinic block", () => {
    const { clinic: _clinic, ...withoutClinic } = validCasePrescription();
    const result = casePrescriptionResponseSchema.safeParse(withoutClinic);

    expect(result.success).toBe(false);
  });
});
