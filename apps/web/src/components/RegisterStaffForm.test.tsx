import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RegisterStaffForm } from "./RegisterStaffForm";
import { ApiError } from "../lib/api-client";

const apiRequestMock = vi.fn();

vi.mock("../lib/api-client", async () => {
  const actual = await vi.importActual<typeof import("../lib/api-client")>("../lib/api-client");
  return {
    ...actual,
    apiRequest: (...args: unknown[]) => apiRequestMock(...args),
  };
});

function renderForm(onCreated: () => void = vi.fn()) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <RegisterStaffForm onCreated={onCreated} />
    </QueryClientProvider>,
  );
}

describe("RegisterStaffForm", () => {
  afterEach(() => {
    apiRequestMock.mockReset();
  });

  it("shows validation errors when submitting an empty form", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findAllByRole("alert")).toHaveLength(3);
    expect(apiRequestMock).not.toHaveBeenCalled();
  });

  it("creates an account with valid input and shows a confirmation", async () => {
    apiRequestMock.mockResolvedValue({
      id: "1",
      email: "newstaff@vetlog.local",
      clinicName: "VetLog Clinic",
    });
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/email/i), "newstaff@vetlog.local");
    await user.type(screen.getByLabelText(/password/i), "long-enough-password");
    await user.type(screen.getByLabelText(/clinic name/i), "VetLog Clinic");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByRole("status")).toHaveTextContent("newstaff@vetlog.local");
    expect(apiRequestMock).toHaveBeenCalledWith(
      "/auth/register",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("shows the server error message on a duplicate email", async () => {
    apiRequestMock.mockRejectedValue(new ApiError(409, "EMAIL_CONFLICT", "A user with this email already exists"));
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/email/i), "dev@vetlog.local");
    await user.type(screen.getByLabelText(/password/i), "long-enough-password");
    await user.type(screen.getByLabelText(/clinic name/i), "VetLog Clinic");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/already exists/i);
  });
});
