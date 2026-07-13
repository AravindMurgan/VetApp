import { z } from "zod";
import { caseTypeSchema, caseStatusSchema } from "./enums";
import { treatmentCreateNestedSchema, treatmentResponseSchema } from "./treatment";
import { weightEntryCreateNestedSchema } from "./weight-entry";
import { followUpCreateNestedSchema, followUpResponseSchema } from "./follow-up";

/**
 * Body for POST /patients/:id/cases — patientId comes from the URL, not the body.
 * Nests optional treatments, a weight entry, and a follow-up in one transactional create.
 */
export const caseCreateSchema = z.object({
  type: caseTypeSchema,
  complaint: z.string().trim().max(500).optional(),
  temperatureC: z.coerce.number().optional(),
  heartRate: z.coerce.number().int().positive().optional(),
  respRate: z.coerce.number().int().positive().optional(),
  clinicalNotes: z.string().trim().max(2000).optional(),
  diagnosis: z.string().trim().max(500).optional(),
  templateId: z.string().uuid().optional(),
  treatments: z.array(treatmentCreateNestedSchema).default([]),
  weightEntry: weightEntryCreateNestedSchema.optional(),
  followUp: followUpCreateNestedSchema.optional(),
});
export type CaseCreate = z.infer<typeof caseCreateSchema>;

export const caseUpdateSchema = z
  .object({
    status: caseStatusSchema,
    complaint: z.string().trim().max(500),
    temperatureC: z.coerce.number(),
    heartRate: z.coerce.number().int().positive(),
    respRate: z.coerce.number().int().positive(),
    clinicalNotes: z.string().trim().max(2000),
    diagnosis: z.string().trim().max(500),
  })
  .partial();
export type CaseUpdate = z.infer<typeof caseUpdateSchema>;

export const caseResponseSchema = z.object({
  id: z.string().uuid(),
  patientId: z.string().uuid(),
  type: caseTypeSchema,
  status: caseStatusSchema,
  visitDate: z.string(),
  complaint: z.string().nullable(),
  temperatureC: z.string().nullable(),
  heartRate: z.number().nullable(),
  respRate: z.number().nullable(),
  clinicalNotes: z.string().nullable(),
  diagnosis: z.string().nullable(),
  templateId: z.string().nullable(),
  createdAt: z.string(),
});
export type CaseResponse = z.infer<typeof caseResponseSchema>;

export const caseWithDetailsResponseSchema = caseResponseSchema.extend({
  treatments: z.array(treatmentResponseSchema),
  followUps: z.array(followUpResponseSchema),
});
export type CaseWithDetailsResponse = z.infer<typeof caseWithDetailsResponseSchema>;
