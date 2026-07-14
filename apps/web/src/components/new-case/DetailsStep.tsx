import { Controller, useFormContext } from "react-hook-form";
import { NumberStepper } from "../NumberStepper";
import type { CaseFormInput } from "../../pages/new-case/form-types";

export function DetailsStep() {
  const { register, control } = useFormContext<CaseFormInput>();

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Details</h2>

      <div>
        <label htmlFor="complaint" className="block text-sm font-medium">
          Complaint
        </label>
        <input
          id="complaint"
          className="mt-1 w-full rounded-md border border-black/20 px-3 py-2"
          {...register("complaint")}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Controller
          control={control}
          name="temperatureC"
          render={({ field }) => (
            <NumberStepper
              id="temperatureC"
              label="Temp (°C)"
              step={0.1}
              value={field.value as number | undefined}
              onChange={field.onChange}
            />
          )}
        />
        <Controller
          control={control}
          name="heartRate"
          render={({ field }) => (
            <NumberStepper
              id="heartRate"
              label="Heart rate"
              step={5}
              value={field.value as number | undefined}
              onChange={field.onChange}
            />
          )}
        />
        <Controller
          control={control}
          name="respRate"
          render={({ field }) => (
            <NumberStepper
              id="respRate"
              label="Resp rate"
              step={1}
              value={field.value as number | undefined}
              onChange={field.onChange}
            />
          )}
        />
      </div>

      <Controller
        control={control}
        name="weightKg"
        render={({ field }) => (
          <NumberStepper
            id="weightKg"
            label="Weight (kg)"
            step={0.1}
            value={field.value as number | undefined}
            onChange={field.onChange}
          />
        )}
      />

      <div>
        <label htmlFor="diagnosis" className="block text-sm font-medium">
          Diagnosis
        </label>
        <input
          id="diagnosis"
          className="mt-1 w-full rounded-md border border-black/20 px-3 py-2"
          {...register("diagnosis")}
        />
      </div>

      <div>
        <label htmlFor="clinicalNotes" className="block text-sm font-medium">
          Notes
        </label>
        <textarea
          id="clinicalNotes"
          rows={3}
          className="mt-1 w-full rounded-md border border-black/20 px-3 py-2"
          {...register("clinicalNotes")}
        />
      </div>
    </div>
  );
}
