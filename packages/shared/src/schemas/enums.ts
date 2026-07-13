import { z } from "zod";

export const speciesSchema = z.enum(["DOG", "CAT", "RABBIT", "BIRD", "OTHER"]);
export type Species = z.infer<typeof speciesSchema>;

export const sexSchema = z.enum(["MALE", "FEMALE", "MALE_NEUTERED", "FEMALE_SPAYED", "UNKNOWN"]);
export type Sex = z.infer<typeof sexSchema>;

export const patientStatusSchema = z.enum(["ACTIVE", "DECEASED", "INACTIVE"]);
export type PatientStatus = z.infer<typeof patientStatusSchema>;

export const caseTypeSchema = z.enum([
  "CONSULTATION",
  "VACCINATION",
  "SURGERY",
  "EMERGENCY",
  "FOLLOW_UP",
  "GROOMING_HEALTH_CHECK",
]);
export type CaseType = z.infer<typeof caseTypeSchema>;

export const caseStatusSchema = z.enum(["OPEN", "CLOSED"]);
export type CaseStatus = z.infer<typeof caseStatusSchema>;

export const followUpReasonSchema = z.enum([
  "REVISIT",
  "VACCINE_DUE",
  "SUTURE_REMOVAL",
  "RECHECK",
  "MEDICATION_REVIEW",
]);
export type FollowUpReason = z.infer<typeof followUpReasonSchema>;

export const followUpStatusSchema = z.enum(["PENDING", "DONE", "MISSED"]);
export type FollowUpStatus = z.infer<typeof followUpStatusSchema>;
