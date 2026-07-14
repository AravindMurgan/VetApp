import { z } from "zod";
import { patientResponseSchema } from "./patient";
import { ownerResponseSchema } from "./owner";
import { caseResponseSchema } from "./case";
import { weightEntryResponseSchema } from "./weight-entry";
import { vaccinationRecordResponseSchema } from "./vaccination-record";

/**
 * GET /patients/:id — the full patient profile: owner details plus the three
 * history tabs (Timeline, Vaccinations, Weight). `cases` is ordered
 * newest-first by the API.
 */
export const patientProfileResponseSchema = patientResponseSchema.extend({
  owner: ownerResponseSchema,
  cases: z.array(caseResponseSchema),
  weights: z.array(weightEntryResponseSchema),
  vaccinations: z.array(vaccinationRecordResponseSchema),
});
export type PatientProfileResponse = z.infer<typeof patientProfileResponseSchema>;
