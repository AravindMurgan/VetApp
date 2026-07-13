import { z } from "zod";

/** Treatment fields with no caseId — used when nesting treatments under a new Case. */
export const treatmentCreateNestedSchema = z.object({
  drugName: z.string().trim().min(1).max(120),
  dose: z.string().trim().min(1).max(60),
  route: z.string().trim().max(30).optional(),
  frequency: z.string().trim().max(30).optional(),
  durationDays: z.coerce.number().int().positive().optional(),
  instructions: z.string().trim().max(300).optional(),
  isProcedure: z.boolean().default(false),
});
export type TreatmentCreateNested = z.infer<typeof treatmentCreateNestedSchema>;

export const treatmentResponseSchema = z.object({
  id: z.string().uuid(),
  caseId: z.string().uuid(),
  drugName: z.string(),
  dose: z.string(),
  route: z.string().nullable(),
  frequency: z.string().nullable(),
  durationDays: z.number().nullable(),
  instructions: z.string().nullable(),
  isProcedure: z.boolean(),
});
export type TreatmentResponse = z.infer<typeof treatmentResponseSchema>;
