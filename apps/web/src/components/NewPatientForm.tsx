import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ownerCreateSchema,
  patientCreateNestedSchema,
  speciesSchema,
  type PatientListResponse,
} from "@vetlog/shared";
import { apiRequest } from "../lib/api-client";
import { useDebouncedValue } from "../lib/use-debounced-value";

const formSchema = z.object({
  phone: ownerCreateSchema.shape.phone,
  ownerName: ownerCreateSchema.shape.name,
  patient: patientCreateNestedSchema,
});
type FormInput = z.input<typeof formSchema>;
type FormValues = z.output<typeof formSchema>;

const SPECIES_OPTIONS = speciesSchema.options;
const PHONE_LOOKUP_MIN_LENGTH = 7;

interface ExistingOwner {
  id: string;
  name: string;
}

export function NewPatientForm({ onCreated }: { onCreated: () => void }) {
  const queryClient = useQueryClient();
  const [existingOwner, setExistingOwner] = useState<ExistingOwner | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { patient: { species: "DOG" } },
  });

  const phone = watch("phone");
  const debouncedPhone = useDebouncedValue(phone, 300);

  useEffect(() => {
    let cancelled = false;

    async function lookupOwner() {
      if (!debouncedPhone || debouncedPhone.trim().length < PHONE_LOOKUP_MIN_LENGTH) {
        setExistingOwner(null);
        return;
      }

      const result = await apiRequest<PatientListResponse>(
        `/patients?search=${encodeURIComponent(debouncedPhone)}`,
      );
      if (cancelled) return;

      const match = result.patients.find((patient) => patient.owner.phone === debouncedPhone);
      if (match) {
        setExistingOwner({ id: match.owner.id, name: match.owner.name });
        setValue("ownerName", match.owner.name);
      } else {
        setExistingOwner(null);
      }
    }

    void lookupOwner();
    return () => {
      cancelled = true;
    };
  }, [debouncedPhone, setValue]);

  const createOwnerMutation = useMutation({
    mutationFn: (values: FormValues) =>
      apiRequest("/owners", {
        method: "POST",
        body: JSON.stringify({
          name: values.ownerName,
          phone: values.phone,
          patient: values.patient,
        }),
      }),
  });

  const createPatientMutation = useMutation({
    mutationFn: (values: FormValues) =>
      apiRequest("/patients", {
        method: "POST",
        body: JSON.stringify({ ownerId: existingOwner?.id, ...values.patient }),
      }),
  });

  async function onSubmit(values: FormValues) {
    try {
      if (existingOwner) {
        await createPatientMutation.mutateAsync(values);
      } else {
        await createOwnerMutation.mutateAsync(values);
      }
    } catch {
      // Surfaced to the user via createOwnerMutation.error / createPatientMutation.error below.
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ["patients"] });
    reset();
    setExistingOwner(null);
    onCreated();
  }

  const submitError = createOwnerMutation.error ?? createPatientMutation.error;

  return (
    <form onSubmit={(event) => void handleSubmit(onSubmit)(event)} noValidate className="space-y-4 p-4">
      <div>
        <label htmlFor="phone" className="block text-sm font-medium">
          Owner phone
        </label>
        <input
          id="phone"
          className="mt-1 w-full rounded-md border border-black/20 px-3 py-2"
          {...register("phone")}
        />
        {errors.phone ? (
          <p role="alert" className="mt-1 text-sm text-danger">
            {errors.phone.message}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="ownerName" className="block text-sm font-medium">
          Owner name
        </label>
        <input
          id="ownerName"
          disabled={!!existingOwner}
          className="mt-1 w-full rounded-md border border-black/20 px-3 py-2 disabled:bg-black/5"
          {...register("ownerName")}
        />
        {existingOwner ? (
          <p className="mt-1 text-sm text-black/60">
            Existing owner found — adding a new pet to this owner.
          </p>
        ) : null}
        {errors.ownerName ? (
          <p role="alert" className="mt-1 text-sm text-danger">
            {errors.ownerName.message}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="patientName" className="block text-sm font-medium">
          Pet name
        </label>
        <input
          id="patientName"
          className="mt-1 w-full rounded-md border border-black/20 px-3 py-2"
          {...register("patient.name")}
        />
        {errors.patient?.name ? (
          <p role="alert" className="mt-1 text-sm text-danger">
            {errors.patient.name.message}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="species" className="block text-sm font-medium">
          Species
        </label>
        <select
          id="species"
          className="mt-1 w-full rounded-md border border-black/20 px-3 py-2"
          {...register("patient.species")}
        >
          {SPECIES_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {errors.patient?.species ? (
          <p role="alert" className="mt-1 text-sm text-danger">
            {errors.patient.species.message}
          </p>
        ) : null}
      </div>

      {submitError ? (
        <p role="alert" className="text-sm text-danger">
          {submitError instanceof Error ? submitError.message : "Something went wrong"}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-primary px-4 py-2 font-medium text-white disabled:opacity-50"
      >
        Save patient
      </button>
    </form>
  );
}
