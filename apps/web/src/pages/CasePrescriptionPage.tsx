import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { CasePrescriptionResponse } from "@vetlog/shared";
import { apiRequest } from "../lib/api-client";
import { CASE_TYPE_LABELS } from "../lib/case-type-labels";

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function treatmentLine(treatment: CasePrescriptionResponse["treatments"][number]): string {
  const parts = [treatment.dose];
  if (treatment.route) parts.push(treatment.route);
  if (treatment.frequency) parts.push(treatment.frequency);
  if (treatment.durationDays) parts.push(`${treatment.durationDays} day(s)`);
  return parts.join(" · ");
}

export default function CasePrescriptionPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ["case-prescription", id],
    queryFn: () => apiRequest<CasePrescriptionResponse>(`/cases/${id}/prescription`),
    enabled: Boolean(id),
  });

  if (isLoading || !data) {
    return (
      <main className="p-4 pb-24">
        <p className="text-black/50">Loading…</p>
      </main>
    );
  }

  const { case: caseData, treatments, recheckFollowUp, patient, owner, clinic } = data;

  return (
    <main className="mx-auto max-w-2xl p-4 pb-24 print:p-0">
      <button
        type="button"
        onClick={() => window.print()}
        className="mb-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white print:hidden"
      >
        Print / Save PDF
      </button>

      <div className="rounded-md border border-black/10 p-6 print:border-0 print:p-0">
        <header className="border-b border-black/20 pb-3 text-center">
          <h1 className="text-xl font-semibold text-primary">{clinic.clinicName}</h1>
          {clinic.clinicAddress ? <p className="text-sm text-black/70">{clinic.clinicAddress}</p> : null}
          {clinic.clinicPhone ? <p className="text-sm text-black/70">{clinic.clinicPhone}</p> : null}
          {clinic.vetRegistrationNumber ? (
            <p className="text-sm text-black/70">Reg. No. {clinic.vetRegistrationNumber}</p>
          ) : null}
        </header>

        <section className="mt-4 flex justify-between text-sm">
          <div>
            <p className="font-medium">{patient.name}</p>
            <p className="text-black/60">{patient.species}{patient.breed ? ` · ${patient.breed}` : ""}</p>
          </div>
          <div className="text-right">
            <p className="font-medium">{owner.name}</p>
            <p className="text-black/60">{owner.phone}</p>
          </div>
        </section>

        <p className="mt-2 text-sm text-black/60">
          {CASE_TYPE_LABELS[caseData.type]} · {formatDate(caseData.visitDate)}
        </p>
        {caseData.diagnosis ? (
          <p className="mt-1 text-sm">
            <span className="font-medium">Diagnosis: </span>
            {caseData.diagnosis}
          </p>
        ) : null}

        <section className="mt-6">
          <p className="text-2xl font-semibold text-primary" aria-hidden="true">
            ℞
          </p>
          {treatments.length === 0 ? (
            <p className="mt-2 text-black/50">No treatments recorded for this case.</p>
          ) : (
            <ul className="mt-2 space-y-3">
              {treatments.map((treatment) => (
                <li key={treatment.id}>
                  <p className="font-medium">{treatment.drugName}</p>
                  <p className="text-sm text-black/70">{treatmentLine(treatment)}</p>
                  {treatment.instructions ? (
                    <p className="text-sm text-black/60">{treatment.instructions}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        {caseData.clinicalNotes ? (
          <section className="mt-6">
            <h2 className="text-sm font-semibold text-black/70">Advice</h2>
            <p className="mt-1 text-sm">{caseData.clinicalNotes}</p>
          </section>
        ) : null}

        {recheckFollowUp ? (
          <p className="mt-4 text-sm">
            <span className="font-medium">Recheck due: </span>
            {formatDate(recheckFollowUp.dueDate)}
          </p>
        ) : null}

        <section className="mt-12 flex justify-end">
          <div className="w-48 border-t border-black/40 pt-1 text-center text-sm text-black/60">
            Signature
          </div>
        </section>
      </div>
    </main>
  );
}
