import { z } from "zod";
import { caseResponseSchema } from "./case";
import { treatmentResponseSchema } from "./treatment";
import { followUpResponseSchema } from "./follow-up";
import { patientResponseSchema } from "./patient";
import { ownerResponseSchema } from "./owner";

/** Everything the printable prescription view (GET /cases/:id/prescription) needs in one response. */
export const casePrescriptionResponseSchema = z.object({
  case: caseResponseSchema,
  treatments: z.array(treatmentResponseSchema),
  recheckFollowUp: followUpResponseSchema.nullable(),
  patient: patientResponseSchema,
  owner: ownerResponseSchema,
  clinic: z.object({
    clinicName: z.string(),
    clinicAddress: z.string().nullable(),
    clinicPhone: z.string().nullable(),
    vetRegistrationNumber: z.string().nullable(),
  }),
});
export type CasePrescriptionResponse = z.infer<typeof casePrescriptionResponseSchema>;
