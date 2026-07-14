import { z } from "zod";
import { patientResponseSchema } from "./patient";
import { ownerResponseSchema } from "./owner";
import { caseResponseSchema } from "./case";
import { weightEntryResponseSchema } from "./weight-entry";
import { vaccinationRecordResponseSchema } from "./vaccination-record";
import { attachmentResponseSchema } from "./attachment";

/**
 * GET /patients/:id — the full patient profile: owner details plus the four
 * history tabs (Timeline, Vaccinations, Weight, Photos). `cases` and
 * `attachments` are ordered newest-first by the API; each attachment's
 * `caseId` links it back to the case it was taken during.
 */
export const patientProfileResponseSchema = patientResponseSchema.extend({
  owner: ownerResponseSchema,
  cases: z.array(caseResponseSchema),
  weights: z.array(weightEntryResponseSchema),
  vaccinations: z.array(vaccinationRecordResponseSchema),
  attachments: z.array(attachmentResponseSchema),
});
export type PatientProfileResponse = z.infer<typeof patientProfileResponseSchema>;
