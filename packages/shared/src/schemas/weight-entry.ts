import { z } from "zod";

/** Weight entry fields with no patientId/caseId — used when nesting under a new Case. */
export const weightEntryCreateNestedSchema = z.object({
  weightKg: z.coerce.number().positive().max(999.99),
  recordedAt: z.coerce.date().optional(),
});
export type WeightEntryCreateNested = z.infer<typeof weightEntryCreateNestedSchema>;

export const weightEntryResponseSchema = z.object({
  id: z.string().uuid(),
  patientId: z.string().uuid(),
  weightKg: z.string(),
  recordedAt: z.string(),
  caseId: z.string().uuid().nullable(),
});
export type WeightEntryResponse = z.infer<typeof weightEntryResponseSchema>;
