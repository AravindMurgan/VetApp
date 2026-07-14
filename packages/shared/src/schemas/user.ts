import { z } from "zod";

/** Body for PATCH /me — clinic letterhead details shown on the printable prescription header. */
export const clinicDetailsUpdateSchema = z
  .object({
    clinicName: z.string().trim().min(1).max(120),
    clinicAddress: z.string().trim().max(300),
    clinicPhone: z.string().trim().max(30),
    vetRegistrationNumber: z.string().trim().max(60),
  })
  .partial();
export type ClinicDetailsUpdate = z.infer<typeof clinicDetailsUpdateSchema>;
