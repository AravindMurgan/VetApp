import { z } from "zod";
import { speciesSchema } from "./enums";

/**
 * One entry in a VaccineSchedule's `doses` JSON array. Primary-course doses
 * are age-based (`ageWeeks`, relative to the patient's date of birth);
 * recurring boosters are interval-based (`intervalDays`, relative to the
 * previous dose). Exactly one of the two is expected to be set per entry.
 */
export const doseDefinitionSchema = z.object({
  label: z.string().trim().min(1).max(60),
  ageWeeks: z.coerce.number().int().positive().optional(),
  intervalDays: z.coerce.number().int().positive().optional(),
});
export type DoseDefinition = z.infer<typeof doseDefinitionSchema>;

export const vaccineScheduleResponseSchema = z.object({
  id: z.string().uuid(),
  species: speciesSchema,
  vaccineName: z.string(),
  doses: z.array(doseDefinitionSchema),
  isPreset: z.boolean(),
  isActive: z.boolean(),
});
export type VaccineScheduleResponse = z.infer<typeof vaccineScheduleResponseSchema>;

export const vaccineScheduleListResponseSchema = z.object({
  vaccineSchedules: z.array(vaccineScheduleResponseSchema),
});
export type VaccineScheduleListResponse = z.infer<typeof vaccineScheduleListResponseSchema>;

export const vaccineScheduleUpdateSchema = z
  .object({
    doses: z.array(doseDefinitionSchema).min(1),
    isActive: z.boolean(),
  })
  .partial();
export type VaccineScheduleUpdate = z.infer<typeof vaccineScheduleUpdateSchema>;
