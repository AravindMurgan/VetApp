import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { PatientListResponse, PatientSearchResult } from "@vetlog/shared";
import { apiRequest } from "../../lib/api-client";
import { useDebouncedValue } from "../../lib/use-debounced-value";
import { SpeciesChip } from "../SpeciesChip";
import { NewPatientForm } from "../NewPatientForm";

interface PatientStepProps {
  onSelect: (patient: PatientSearchResult) => void;
}

export function PatientStep({ onSelect }: PatientStepProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);

  const { data, isLoading } = useQuery({
    queryKey: ["patients", debouncedSearchTerm],
    queryFn: () =>
      apiRequest<PatientListResponse>(`/patients?search=${encodeURIComponent(debouncedSearchTerm)}`),
  });

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Find patient</h2>
      <input
        type="search"
        placeholder="Search by name, owner, or phone"
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        aria-label="Search patients"
        className="w-full rounded-md border border-black/20 px-3 py-2"
      />

      <button
        type="button"
        onClick={() => setShowNewPatientForm((open) => !open)}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white"
      >
        {showNewPatientForm ? "Cancel" : "+ New patient"}
      </button>

      {showNewPatientForm ? <NewPatientForm onCreated={() => setShowNewPatientForm(false)} /> : null}

      {isLoading ? (
        <p className="text-black/50">Loading…</p>
      ) : (
        <ul className="space-y-2">
          {data?.patients.map((patient) => (
            <li key={patient.id}>
              <button
                type="button"
                onClick={() => onSelect(patient)}
                className="flex w-full items-center justify-between rounded-md border border-black/10 p-3 text-left"
              >
                <div>
                  <p className="font-medium">{patient.name}</p>
                  <p className="text-sm text-black/60">
                    {patient.owner.name} · {patient.owner.phone}
                  </p>
                </div>
                <SpeciesChip species={patient.species} />
              </button>
            </li>
          ))}
        </ul>
      )}
      {data && data.patients.length === 0 ? (
        <p className="text-black/50">No patients found.</p>
      ) : null}
    </div>
  );
}
