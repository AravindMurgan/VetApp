import { z } from "zod";
import { speciesSchema, sexSchema, patientStatusSchema } from "./enums";

const patientBaseFields = {
  name: z.string().trim().min(1).max(120),
  species: speciesSchema,
  breed: z.string().trim().max(120).optional(),
  sex: sexSchema.default("UNKNOWN"),
  dateOfBirth: z.coerce.date().optional(),
  ageIsApprox: z.boolean().default(false),
  colorMarkings: z.string().trim().max(300).optional(),
  microchipId: z.string().trim().max(50).optional(),
};

/** Patient fields with no ownerId — used when nesting a first patient under a new Owner. */
export const patientCreateNestedSchema = z.object(patientBaseFields);
export type PatientCreateNested = z.infer<typeof patientCreateNestedSchema>;

export const patientCreateSchema = z.object({
  ownerId: z.string().uuid(),
  ...patientBaseFields,
});
export type PatientCreate = z.infer<typeof patientCreateSchema>;

export const patientUpdateSchema = z
  .object({
    ...patientBaseFields,
    status: patientStatusSchema,
  })
  .partial();
export type PatientUpdate = z.infer<typeof patientUpdateSchema>;

export const patientResponseSchema = z.object({
  id: z.string().uuid(),
  ownerId: z.string().uuid(),
  name: z.string(),
  species: speciesSchema,
  breed: z.string().nullable(),
  sex: sexSchema,
  dateOfBirth: z.string().nullable(),
  ageIsApprox: z.boolean(),
  colorMarkings: z.string().nullable(),
  microchipId: z.string().nullable(),
  status: patientStatusSchema,
  createdAt: z.string(),
});
export type PatientResponse = z.infer<typeof patientResponseSchema>;
