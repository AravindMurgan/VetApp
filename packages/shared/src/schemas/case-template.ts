import { z } from "zod";
import { caseTypeSchema, speciesSchema } from "./enums";

export const treatmentLineDefaultSchema = z.object({
  drugName: z.string(),
  dose: z.string(),
  route: z.string().optional(),
  frequency: z.string().optional(),
  durationDays: z.number().optional(),
  isProcedure: z.boolean().optional(),
});
export type TreatmentLineDefault = z.infer<typeof treatmentLineDefaultSchema>;

export const caseTemplateDefaultsSchema = z.object({
  complaint: z.string().optional(),
  diagnosis: z.string().optional(),
  treatmentLines: z.array(treatmentLineDefaultSchema).default([]),
  followUpDays: z.number().nullable(),
});
export type CaseTemplateDefaults = z.infer<typeof caseTemplateDefaultsSchema>;

export const caseTemplateResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  caseType: caseTypeSchema,
  species: speciesSchema.nullable(),
  defaults: caseTemplateDefaultsSchema,
  isActive: z.boolean(),
});
export type CaseTemplateResponse = z.infer<typeof caseTemplateResponseSchema>;

export const caseTemplateListResponseSchema = z.object({
  templates: z.array(caseTemplateResponseSchema),
});
export type CaseTemplateListResponse = z.infer<typeof caseTemplateListResponseSchema>;
