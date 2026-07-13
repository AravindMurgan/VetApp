import { z } from "zod";
import { patientResponseSchema } from "./patient";
import { ownerResponseSchema } from "./owner";

export const patientSearchResultSchema = patientResponseSchema.extend({
  owner: ownerResponseSchema.pick({ id: true, name: true, phone: true }),
});
export type PatientSearchResult = z.infer<typeof patientSearchResultSchema>;

export const patientListResponseSchema = z.object({
  patients: z.array(patientSearchResultSchema),
});
export type PatientListResponse = z.infer<typeof patientListResponseSchema>;
