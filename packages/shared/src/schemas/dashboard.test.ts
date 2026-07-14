import { describe, expect, it } from "vitest";
import { dashboardTodayResponseSchema } from "./dashboard";

const VALID_UUID = "3fa85f64-5717-4562-b3fc-2c963f66afa6";

describe("dashboardTodayResponseSchema", () => {
  it("accepts a well-formed dashboard response", () => {
    const result = dashboardTodayResponseSchema.safeParse({
      date: "2026-07-13",
      casesToday: [
        {
          id: VALID_UUID,
          patientId: VALID_UUID,
          type: "CONSULTATION",
          status: "OPEN",
          visitDate: "2026-07-13T10:00:00.000Z",
          complaint: null,
          temperatureC: null,
          heartRate: null,
          respRate: null,
          clinicalNotes: null,
          diagnosis: null,
          templateId: null,
          createdAt: "2026-07-13T10:00:00.000Z",
          patient: { id: VALID_UUID, name: "Bruno", species: "DOG" },
        },
      ],
      followUpCounts: { dueToday: 2, overdue: 1 },
    });

    expect(result.success).toBe(true);
  });

  it("accepts an empty today with zero counts", () => {
    const result = dashboardTodayResponseSchema.safeParse({
      date: "2026-07-13",
      casesToday: [],
      followUpCounts: { dueToday: 0, overdue: 0 },
    });

    expect(result.success).toBe(true);
  });

  it("rejects a missing followUpCounts", () => {
    const result = dashboardTodayResponseSchema.safeParse({
      date: "2026-07-13",
      casesToday: [],
    });

    expect(result.success).toBe(false);
  });
});
