import { z } from "zod";
import { caseCreateSchema } from "@vetlog/shared";

// weightKg is kept flat (not nested under weightEntry) because react-hook-form's
// Controller auto-vivifies the parent object the moment a nested path like
// "weightEntry.weightKg" is registered — even with no value entered, weightEntry
// becomes `{ weightKg: undefined }` instead of staying `undefined`, which breaks
// caseCreateSchema's top-level `.optional()` on weightEntry (the object exists,
// just with an invalid inner value). Nesting it back into weightEntry happens
// once, at submit time, in NewCasePage's onSubmit.
export const caseFormSchema = caseCreateSchema.omit({ weightEntry: true }).extend({
  weightKg: z.coerce.number().positive().max(999.99).optional(),
});

export type CaseFormInput = z.input<typeof caseFormSchema>;
export type CaseFormOutput = z.output<typeof caseFormSchema>;
