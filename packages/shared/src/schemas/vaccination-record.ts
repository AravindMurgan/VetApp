import { z } from "zod";

/** Nested under a VACCINATION case create — no patientId/caseId/nextDueAt, all server-computed. */
export const vaccinationCreateNestedSchema = z.object({
  vaccineName: z.string().trim().min(1).max(120),
  doseLabel: z.string().trim().min(1).max(60),
  givenAt: z.coerce.date().optional(),
  batchNo: z.string().trim().max(60).optional(),
});
export type VaccinationCreateNested = z.infer<typeof vaccinationCreateNestedSchema>;

export const vaccinationRecordResponseSchema = z.object({
  id: z.string().uuid(),
  patientId: z.string().uuid(),
  vaccineName: z.string(),
  doseLabel: z.string(),
  givenAt: z.string(),
  batchNo: z.string().nullable(),
  nextDueAt: z.string().nullable(),
  caseId: z.string().uuid().nullable(),
});
export type VaccinationRecordResponse = z.infer<typeof vaccinationRecordResponseSchema>;
