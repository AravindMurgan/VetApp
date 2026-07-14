import { useState } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import type { DrugNameListResponse } from "@vetlog/shared";
import { apiRequest } from "../../lib/api-client";
import type { CaseFormInput } from "../../pages/new-case/form-types";

const FOLLOW_UP_OFFSETS = [
  { label: "3 days", days: 3 },
  { label: "1 week", days: 7 },
  { label: "2 weeks", days: 14 },
];

function toDateInputValue(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().slice(0, 10);
}

export function TreatmentsStep() {
  const { register, control, setValue, watch } = useFormContext<CaseFormInput>();
  const { fields, append, remove } = useFieldArray({ control, name: "treatments" });
  const [showCustomDate, setShowCustomDate] = useState(false);

  const { data: drugNamesData } = useQuery({
    queryKey: ["drug-names"],
    queryFn: () => apiRequest<DrugNameListResponse>("/treatments/drug-names"),
  });

  const followUp = watch("followUp");

  function setFollowUpOffset(days: number) {
    setShowCustomDate(false);
    setValue("followUp", { dueDate: toDateInputValue(days), reason: "REVISIT" });
  }

  function clearFollowUp() {
    setShowCustomDate(false);
    setValue("followUp", undefined);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Treatments</h2>

      <datalist id="drug-name-options">
        {drugNamesData?.drugNames.map((name) => <option key={name} value={name} />)}
      </datalist>

      <div className="space-y-3">
        {fields.map((field, index) => (
          <div key={field.id} className="space-y-2 rounded-md border border-black/10 p-3">
            <input
              list="drug-name-options"
              placeholder="Drug name"
              aria-label={`Treatment ${index + 1} drug name`}
              className="w-full rounded-md border border-black/20 px-3 py-2"
              {...register(`treatments.${index}.drugName`)}
            />
            <input
              placeholder="Dose (e.g. 250 mg)"
              aria-label={`Treatment ${index + 1} dose`}
              className="w-full rounded-md border border-black/20 px-3 py-2"
              {...register(`treatments.${index}.dose`)}
            />
            <button type="button" onClick={() => remove(index)} className="text-sm text-danger">
              Remove
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => append({ drugName: "", dose: "", isProcedure: false })}
        className="rounded-md border border-black/20 px-4 py-2 text-sm font-medium"
      >
        + Add treatment
      </button>

      <div>
        <h3 className="text-sm font-semibold text-black/70">Follow-up</h3>
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Follow-up date">
          {FOLLOW_UP_OFFSETS.map((offset) => (
            <button
              key={offset.label}
              type="button"
              onClick={() => setFollowUpOffset(offset.days)}
              className="rounded-full border border-black/20 px-3 py-1.5 text-sm font-medium"
            >
              {offset.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowCustomDate(true)}
            className="rounded-full border border-black/20 px-3 py-1.5 text-sm font-medium"
          >
            Custom
          </button>
          {followUp ? (
            <button
              type="button"
              onClick={clearFollowUp}
              className="rounded-full border border-black/20 px-3 py-1.5 text-sm font-medium text-danger"
            >
              Clear
            </button>
          ) : null}
        </div>
        {showCustomDate ? (
          <input
            type="date"
            aria-label="Custom follow-up date"
            className="mt-2 rounded-md border border-black/20 px-3 py-2"
            onChange={(event) => setValue("followUp", { dueDate: event.target.value, reason: "REVISIT" })}
          />
        ) : null}
      </div>
    </div>
  );
}
