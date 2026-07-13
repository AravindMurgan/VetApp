import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { PatientListResponse } from "@vetlog/shared";
import { apiRequest } from "../lib/api-client";
import { useDebouncedValue } from "../lib/use-debounced-value";
import { SpeciesChip } from "../components/SpeciesChip";
import { NewPatientForm } from "../components/NewPatientForm";

export default function PatientsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);

  const { data, isLoading } = useQuery({
    queryKey: ["patients", debouncedSearchTerm],
    queryFn: () =>
      apiRequest<PatientListResponse>(`/patients?search=${encodeURIComponent(debouncedSearchTerm)}`),
  });

  return (
    <main className="p-4">
      <h1 className="text-xl font-semibold text-primary">Patients</h1>

      <input
        type="search"
        placeholder="Search by name, owner, or phone"
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        className="mt-4 w-full rounded-md border border-black/20 px-3 py-2"
        aria-label="Search patients"
      />

      <button
        type="button"
        onClick={() => setShowNewPatientForm((open) => !open)}
        className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white"
      >
        {showNewPatientForm ? "Cancel" : "+ New patient"}
      </button>

      {showNewPatientForm ? <NewPatientForm onCreated={() => setShowNewPatientForm(false)} /> : null}

      {isLoading ? (
        <p className="mt-4 text-black/50">Loading…</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {data?.patients.map((patient) => (
            <li
              key={patient.id}
              className="flex items-center justify-between rounded-md border border-black/10 p-3"
            >
              <div>
                <p className="font-medium">{patient.name}</p>
                <p className="text-sm text-black/60">
                  {patient.owner.name} · {patient.owner.phone}
                </p>
              </div>
              <SpeciesChip species={patient.species} />
            </li>
          ))}
        </ul>
      )}
      {data && data.patients.length === 0 ? (
        <p className="mt-4 text-black/50">No patients found.</p>
      ) : null}
    </main>
  );
}
