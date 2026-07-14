import { z } from "zod";
import { followUpReasonSchema, followUpStatusSchema } from "./enums";
import { patientResponseSchema } from "./patient";
import { ownerResponseSchema } from "./owner";

/** Follow-up fields with no caseId/patientId/status — used when nesting under a new Case. */
export const followUpCreateNestedSchema = z.object({
  dueDate: z.coerce.date(),
  reason: followUpReasonSchema,
  notes: z.string().trim().max(500).optional(),
});
export type FollowUpCreateNested = z.infer<typeof followUpCreateNestedSchema>;

export const followUpUpdateSchema = z
  .object({
    status: followUpStatusSchema,
    notes: z.string().trim().max(500),
  })
  .partial();
export type FollowUpUpdate = z.infer<typeof followUpUpdateSchema>;

export const followUpBucketSchema = z.enum(["overdue", "today", "upcoming"]);
export type FollowUpBucket = z.infer<typeof followUpBucketSchema>;

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

export const followUpSummaryResponseSchema = followUpResponseSchema.extend({
  patient: patientResponseSchema.pick({ id: true, name: true, species: true }),
  owner: ownerResponseSchema.pick({ id: true, name: true, phone: true }),
});
export type FollowUpSummaryResponse = z.infer<typeof followUpSummaryResponseSchema>;

export const followUpListResponseSchema = z.object({
  followUps: z.array(followUpSummaryResponseSchema),
});
export type FollowUpListResponse = z.infer<typeof followUpListResponseSchema>;
