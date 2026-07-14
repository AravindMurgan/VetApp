import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { registerRequestSchema, type RegisterRequest, type RegisterResponse } from "@vetlog/shared";
import { apiRequest, ApiError } from "../lib/api-client";

export function RegisterStaffForm({ onCreated }: { onCreated?: () => void }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RegisterRequest>({
    resolver: zodResolver(registerRequestSchema),
  });

  const registerMutation = useMutation({
    mutationFn: (values: RegisterRequest) =>
      apiRequest<RegisterResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify(values),
      }),
    onSuccess: () => {
      reset();
      onCreated?.();
    },
  });

  async function onSubmit(values: RegisterRequest) {
    try {
      await registerMutation.mutateAsync(values);
    } catch {
      // Surfaced to the user via registerMutation.error below.
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(onSubmit)(event)} noValidate className="space-y-4 p-4">
      <div>
        <label htmlFor="registerEmail" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="registerEmail"
          type="email"
          autoComplete="off"
          className="mt-1 w-full rounded-md border border-black/20 px-3 py-2"
          {...register("email")}
        />
        {errors.email ? (
          <p role="alert" className="mt-1 text-sm text-danger">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="registerPassword" className="block text-sm font-medium">
          Password
        </label>
        <input
          id="registerPassword"
          type="password"
          autoComplete="new-password"
          className="mt-1 w-full rounded-md border border-black/20 px-3 py-2"
          {...register("password")}
        />
        {errors.password ? (
          <p role="alert" className="mt-1 text-sm text-danger">
            {errors.password.message}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="registerClinicName" className="block text-sm font-medium">
          Clinic name
        </label>
        <input
          id="registerClinicName"
          className="mt-1 w-full rounded-md border border-black/20 px-3 py-2"
          {...register("clinicName")}
        />
        {errors.clinicName ? (
          <p role="alert" className="mt-1 text-sm text-danger">
            {errors.clinicName.message}
          </p>
        ) : null}
      </div>

      {registerMutation.isError ? (
        <p role="alert" className="text-sm text-danger">
          {registerMutation.error instanceof ApiError
            ? registerMutation.error.message
            : "Unable to create account"}
        </p>
      ) : null}

      {registerMutation.isSuccess ? (
        <p role="status" className="text-sm text-primary">
          Account created for {registerMutation.data.email}.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-primary px-4 py-2 font-medium text-white disabled:opacity-50"
      >
        Create account
      </button>
    </form>
  );
}
