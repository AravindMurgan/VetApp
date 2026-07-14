import { z } from "zod";
import { caseCreateSchema, type Species } from "@vetlog/shared";

/**
 * The subset of patient info NewCasePage actually needs. `PatientSearchResult`
 * (from the search step) structurally satisfies this, but so does the smaller
 * payload available when arriving from a completed follow-up (which only
 * carries {id, name, species} + {name} for the owner), so this stays the
 * canonical "selected patient" type instead of forcing the full search shape.
 */
export interface SelectedPatient {
  id: string;
  name: string;
  species: Species;
  owner: { name: string };
}

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
