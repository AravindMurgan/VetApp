import { z } from "zod";
import { caseResponseSchema } from "./case";
import { patientResponseSchema } from "./patient";
import { followUpResponseSchema } from "./follow-up";
import { ownerResponseSchema } from "./owner";

export const caseSummaryResponseSchema = caseResponseSchema.extend({
  patient: patientResponseSchema.pick({ id: true, name: true, species: true }),
});
export type CaseSummaryResponse = z.infer<typeof caseSummaryResponseSchema>;

export const followUpSummaryResponseSchema = followUpResponseSchema.extend({
  patient: patientResponseSchema.pick({ id: true, name: true, species: true }),
  owner: ownerResponseSchema.pick({ id: true, name: true, phone: true }),
});
export type FollowUpSummaryResponse = z.infer<typeof followUpSummaryResponseSchema>;

export const dashboardTodayResponseSchema = z.object({
  date: z.string(),
  casesToday: z.array(caseSummaryResponseSchema),
  followUpsDueToday: z.array(followUpSummaryResponseSchema),
  followUpCounts: z.object({
    dueToday: z.number(),
    overdue: z.number(),
  }),
});
export type DashboardTodayResponse = z.infer<typeof dashboardTodayResponseSchema>;
