import { z } from "zod";
import { followUpReasonSchema, followUpStatusSchema } from "./enums";

/** Follow-up fields with no caseId/patientId/status — used when nesting under a new Case. */
export const followUpCreateNestedSchema = z.object({
  dueDate: z.coerce.date(),
  reason: followUpReasonSchema,
  notes: z.string().trim().max(500).optional(),
});
export type FollowUpCreateNested = z.infer<typeof followUpCreateNestedSchema>;

export const followUpResponseSchema = z.object({
  id: z.string().uuid(),
  caseId: z.string().uuid().nullable(),
  patientId: z.string().uuid(),
  dueDate: z.string(),
  reason: followUpReasonSchema,
  notes: z.string().nullable(),
  status: followUpStatusSchema,
});
export type FollowUpResponse = z.infer<typeof followUpResponseSchema>;
