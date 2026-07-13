import { z } from "zod";

export const speciesSchema = z.enum(["DOG", "CAT", "RABBIT", "BIRD", "OTHER"]);
export type Species = z.infer<typeof speciesSchema>;

export const sexSchema = z.enum(["MALE", "FEMALE", "MALE_NEUTERED", "FEMALE_SPAYED", "UNKNOWN"]);
export type Sex = z.infer<typeof sexSchema>;

export const patientStatusSchema = z.enum(["ACTIVE", "DECEASED", "INACTIVE"]);
export type PatientStatus = z.infer<typeof patientStatusSchema>;
