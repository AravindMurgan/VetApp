import { z } from "zod";
import { caseResponseSchema } from "./case";
import { patientResponseSchema } from "./patient";
import { followUpSummaryResponseSchema } from "./follow-up";

export const caseSummaryResponseSchema = caseResponseSchema.extend({
  patient: patientResponseSchema.pick({ id: true, name: true, species: true }),
});
export type CaseSummaryResponse = z.infer<typeof caseSummaryResponseSchema>;

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
