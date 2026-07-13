import { z } from "zod";
import { patientCreateNestedSchema, patientResponseSchema } from "./patient";

const phoneSchema = z
  .string()
  .trim()
  .min(7)
  .max(20)
  .regex(/^[0-9+\-() ]+$/, "Phone number may only contain digits, spaces, and + - ( )");

const ownerBaseFields = {
  name: z.string().trim().min(1).max(120),
  phone: phoneSchema,
  altPhone: phoneSchema.optional(),
  address: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(2000).optional(),
};

export const ownerCreateSchema = z.object(ownerBaseFields);
export type OwnerCreate = z.infer<typeof ownerCreateSchema>;

/** Owner + first patient created together, per SPEC §8 POST /owners. */
export const ownerCreateWithPatientSchema = z.object({
  ...ownerBaseFields,
  patient: patientCreateNestedSchema,
});
export type OwnerCreateWithPatient = z.infer<typeof ownerCreateWithPatientSchema>;

export const ownerUpdateSchema = z.object(ownerBaseFields).partial();
export type OwnerUpdate = z.infer<typeof ownerUpdateSchema>;

export const ownerResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  phone: z.string(),
  altPhone: z.string().nullable(),
  address: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
});
export type OwnerResponse = z.infer<typeof ownerResponseSchema>;

export const ownerWithPatientsResponseSchema = ownerResponseSchema.extend({
  patients: z.array(patientResponseSchema),
});
export type OwnerWithPatientsResponse = z.infer<typeof ownerWithPatientsResponseSchema>;
