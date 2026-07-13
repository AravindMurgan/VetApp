import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginRequestSchema, type LoginRequest } from "@vetlog/shared";
import { useAuth } from "../auth/auth-context";
import { ApiError } from "../lib/api-client";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginRequest>({
    resolver: zodResolver(loginRequestSchema),
  });

  async function onSubmit(data: LoginRequest) {
    setServerError(null);
    try {
      await login(data.email, data.password);
      navigate("/today", { replace: true });
    } catch (error) {
      setServerError(error instanceof ApiError ? error.message : "Unable to log in");
    }
  }

  return (
    <main className="flex min-h-screen flex-col justify-center bg-paper p-6">
      <h1 className="mb-6 text-2xl font-semibold text-primary">VetLog</h1>
      <form onSubmit={(event) => void handleSubmit(onSubmit)(event)} noValidate className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="username"
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
          <label htmlFor="password" className="block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className="mt-1 w-full rounded-md border border-black/20 px-3 py-2"
            {...register("password")}
          />
          {errors.password ? (
            <p role="alert" className="mt-1 text-sm text-danger">
              {errors.password.message}
            </p>
          ) : null}
        </div>

        {serverError ? (
          <p role="alert" className="text-sm text-danger">
            {serverError}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-primary px-4 py-2 font-medium text-white disabled:opacity-50"
        >
          Log in
        </button>
      </form>
    </main>
  );
}
