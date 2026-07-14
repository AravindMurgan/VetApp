import type { CaseSummaryResponse } from "@vetlog/shared";
import { SPECIES_SPINE_BORDER } from "../lib/species-colors";
import { CASE_TYPE_LABELS } from "../lib/case-type-labels";

export function CaseCard({ case: caseSummary }: { case: CaseSummaryResponse }) {
  return (
    <li
      className={`rounded-md border border-black/10 border-l-4 p-3 ${SPECIES_SPINE_BORDER[caseSummary.patient.species]}`}
    >
      <p className="font-medium">{caseSummary.patient.name}</p>
      <p className="text-sm text-black/60">{CASE_TYPE_LABELS[caseSummary.type]}</p>
      {caseSummary.complaint ? <p className="text-sm text-black/60">{caseSummary.complaint}</p> : null}
    </li>
  );
}
