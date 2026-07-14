import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useFormContext } from "react-hook-form";
import type { Species, VaccineScheduleListResponse } from "@vetlog/shared";
import { apiRequest } from "../../lib/api-client";
import type { CaseFormInput } from "../../pages/new-case/form-types";

export function VaccinePicker({ patientSpecies }: { patientSpecies: Species }) {
  const { watch, setValue } = useFormContext<CaseFormInput>();
  const vaccination = watch("vaccination");
  const [selectedVaccineName, setSelectedVaccineName] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["vaccine-schedules", patientSpecies],
    queryFn: () =>
      apiRequest<VaccineScheduleListResponse>(
        `/vaccine-schedules?species=${patientSpecies}&activeOnly=true`,
      ),
  });

  const schedules = data?.vaccineSchedules ?? [];
  const selectedSchedule = schedules.find((schedule) => schedule.vaccineName === selectedVaccineName);

  function selectVaccine(vaccineName: string) {
    setSelectedVaccineName(vaccineName);
    setValue("vaccination", undefined);
  }

  function selectDose(doseLabel: string) {
    if (!selectedVaccineName) {
      return;
    }
    setValue("vaccination", { vaccineName: selectedVaccineName, doseLabel });
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-black/70">Vaccine</h3>
      <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Vaccine">
        {schedules.map((schedule) => (
          <button
            key={schedule.id}
            type="button"
            onClick={() => selectVaccine(schedule.vaccineName)}
            aria-pressed={selectedVaccineName === schedule.vaccineName}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
              selectedVaccineName === schedule.vaccineName
                ? "border-primary bg-primary text-white"
                : "border-black/20"
            }`}
          >
            {schedule.vaccineName}
          </button>
        ))}
      </div>

      {selectedSchedule ? (
        <div className="mt-3">
          <h3 className="text-sm font-semibold text-black/70">Dose</h3>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Dose">
            {selectedSchedule.doses.map((dose) => (
              <button
                key={dose.label}
                type="button"
                onClick={() => selectDose(dose.label)}
                aria-pressed={vaccination?.doseLabel === dose.label}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
                  vaccination?.doseLabel === dose.label
                    ? "border-primary bg-primary text-white"
                    : "border-black/20"
                }`}
              >
                {dose.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
