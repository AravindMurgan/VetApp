import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { DoseDefinition, VaccineScheduleListResponse, VaccineScheduleResponse } from "@vetlog/shared";
import { apiRequest } from "../lib/api-client";

function DoseEditor({ schedule }: { schedule: VaccineScheduleResponse }) {
  const queryClient = useQueryClient();
  const [doses, setDoses] = useState<DoseDefinition[]>(schedule.doses);

  const saveDosesMutation = useMutation({
    mutationFn: () =>
      apiRequest(`/vaccine-schedules/${schedule.id}`, {
        method: "PATCH",
        body: JSON.stringify({ doses }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vaccine-schedules"] }),
  });

  function updateDoseLabel(index: number, value: string) {
    setDoses((current) => current.map((dose, i) => (i === index ? { ...dose, label: value } : dose)));
  }

  function updateDoseNumber(index: number, field: "ageWeeks" | "intervalDays", value: string) {
    const numeric = value === "" ? undefined : Number(value);
    setDoses((current) => current.map((dose, i) => (i === index ? { ...dose, [field]: numeric } : dose)));
  }

  function removeDose(index: number) {
    setDoses((current) => current.filter((_, i) => i !== index));
  }

  function addDose() {
    setDoses((current) => [...current, { label: "" }]);
  }

  return (
    <div className="mt-2 space-y-2 rounded-md border border-black/10 p-3">
      {doses.map((dose, index) => (
        <div key={index} className="flex flex-wrap items-center gap-2">
          <input
            aria-label={`Dose ${index + 1} label`}
            value={dose.label}
            onChange={(event) => updateDoseLabel(index, event.target.value)}
            className="w-32 rounded-md border border-black/20 px-2 py-1 text-sm"
          />
          <input
            aria-label={`Dose ${index + 1} age weeks`}
            type="number"
            placeholder="Age (wks)"
            value={dose.ageWeeks ?? ""}
            onChange={(event) => updateDoseNumber(index, "ageWeeks", event.target.value)}
            className="w-24 rounded-md border border-black/20 px-2 py-1 text-sm"
          />
          <input
            aria-label={`Dose ${index + 1} interval days`}
            type="number"
            placeholder="Interval (days)"
            value={dose.intervalDays ?? ""}
            onChange={(event) => updateDoseNumber(index, "intervalDays", event.target.value)}
            className="w-28 rounded-md border border-black/20 px-2 py-1 text-sm"
          />
          <button type="button" onClick={() => removeDose(index)} className="text-sm text-danger">
            Remove
          </button>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={addDose}
          className="rounded-md border border-black/20 px-3 py-1.5 text-sm font-medium"
        >
          + Add dose
        </button>
        <button
          type="button"
          onClick={() => saveDosesMutation.mutate()}
          disabled={saveDosesMutation.isPending}
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          Save doses
        </button>
        {saveDosesMutation.isSuccess ? <span className="text-sm text-primary">Saved.</span> : null}
      </div>
    </div>
  );
}

export default function VaccineSchedulesPage() {
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["vaccine-schedules", "all"],
    queryFn: () => apiRequest<VaccineScheduleListResponse>("/vaccine-schedules"),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiRequest(`/vaccine-schedules/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vaccine-schedules"] }),
  });

  return (
    <main className="p-4 pb-24">
      <h1 className="text-xl font-semibold text-primary">Vaccine schedules</h1>

      {isLoading ? (
        <p className="mt-4 text-black/50">Loading…</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {data?.vaccineSchedules.map((schedule) => (
            <li key={schedule.id} className="rounded-md border border-black/10 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {schedule.vaccineName} <span className="text-black/50">({schedule.species})</span>
                  </p>
                  <p className="text-sm text-black/60">{schedule.doses.length} dose(s)</p>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      checked={schedule.isActive}
                      onChange={(event) =>
                        toggleActiveMutation.mutate({ id: schedule.id, isActive: event.target.checked })
                      }
                    />
                    Active
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedId((current) => (current === schedule.id ? null : schedule.id))
                    }
                    className="text-sm font-medium text-primary underline"
                  >
                    {expandedId === schedule.id ? "Hide doses" : "Edit doses"}
                  </button>
                </div>
              </div>
              {expandedId === schedule.id ? <DoseEditor schedule={schedule} /> : null}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
