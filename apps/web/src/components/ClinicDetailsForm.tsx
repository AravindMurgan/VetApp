import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clinicDetailsUpdateSchema, type AuthUser, type ClinicDetailsUpdate } from "@vetlog/shared";
import { apiRequest, ApiError } from "../lib/api-client";

export function ClinicDetailsForm() {
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiRequest<AuthUser>("/me"),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ClinicDetailsUpdate>({
    resolver: zodResolver(clinicDetailsUpdateSchema),
    values: data
      ? {
          clinicName: data.clinicName,
          clinicAddress: data.clinicAddress ?? "",
          clinicPhone: data.clinicPhone ?? "",
          vetRegistrationNumber: data.vetRegistrationNumber ?? "",
        }
      : undefined,
  });

  const updateMutation = useMutation({
    mutationFn: (values: ClinicDetailsUpdate) =>
      apiRequest<AuthUser>("/me", { method: "PATCH", body: JSON.stringify(values) }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["me"], updated);
    },
  });

  async function onSubmit(values: ClinicDetailsUpdate) {
    try {
      await updateMutation.mutateAsync(values);
    } catch {
      // Surfaced to the user via updateMutation.error below.
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(onSubmit)(event)} noValidate className="space-y-4 p-4">
      <div>
        <label htmlFor="clinicName" className="block text-sm font-medium">
          Clinic name
        </label>
        <input
          id="clinicName"
          className="mt-1 w-full rounded-md border border-black/20 px-3 py-2"
          {...register("clinicName")}
        />
        {errors.clinicName ? (
          <p role="alert" className="mt-1 text-sm text-danger">
            {errors.clinicName.message}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="clinicAddress" className="block text-sm font-medium">
          Address
        </label>
        <input
          id="clinicAddress"
          className="mt-1 w-full rounded-md border border-black/20 px-3 py-2"
          {...register("clinicAddress")}
        />
      </div>

      <div>
        <label htmlFor="clinicPhone" className="block text-sm font-medium">
          Phone
        </label>
        <input
          id="clinicPhone"
          className="mt-1 w-full rounded-md border border-black/20 px-3 py-2"
          {...register("clinicPhone")}
        />
      </div>

      <div>
        <label htmlFor="vetRegistrationNumber" className="block text-sm font-medium">
          Vet registration number
        </label>
        <input
          id="vetRegistrationNumber"
          className="mt-1 w-full rounded-md border border-black/20 px-3 py-2"
          {...register("vetRegistrationNumber")}
        />
      </div>

      {updateMutation.isError ? (
        <p role="alert" className="text-sm text-danger">
          {updateMutation.error instanceof ApiError
            ? updateMutation.error.message
            : "Unable to save clinic details"}
        </p>
      ) : null}

      {updateMutation.isSuccess ? (
        <p role="status" className="text-sm text-primary">
          Saved.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-primary px-4 py-2 font-medium text-white disabled:opacity-50"
      >
        Save clinic details
      </button>
    </form>
  );
}
