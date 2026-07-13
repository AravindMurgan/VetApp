import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NewPatientForm } from "./NewPatientForm";

const apiRequestMock = vi.fn();

vi.mock("../lib/api-client", () => ({
  apiRequest: (...args: unknown[]) => apiRequestMock(...args),
}));

function renderForm(onCreated: () => void = vi.fn()) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <NewPatientForm onCreated={onCreated} />
    </QueryClientProvider>,
  );
}

describe("NewPatientForm validation", () => {
  afterEach(() => {
    apiRequestMock.mockReset();
  });

  it("shows validation errors when submitting an empty form", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: /save patient/i }));

    expect(await screen.findAllByRole("alert")).toHaveLength(3);
  });

  it("does not call the create-owner or create-patient endpoints when validation fails", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: /save patient/i }));
    await screen.findAllByRole("alert");

    expect(apiRequestMock).not.toHaveBeenCalledWith("/owners", expect.anything());
    expect(apiRequestMock).not.toHaveBeenCalledWith("/patients", expect.anything());
  });

  it("prefills and locks the owner name when the phone matches an existing owner", async () => {
    apiRequestMock.mockResolvedValue({
      patients: [
        {
          id: "p1",
          ownerId: "o1",
          name: "Bruno",
          species: "DOG",
          breed: null,
          sex: "UNKNOWN",
          dateOfBirth: null,
          ageIsApprox: false,
          colorMarkings: null,
          microchipId: null,
          status: "ACTIVE",
          createdAt: "2026-07-13T00:00:00.000Z",
          owner: { id: "o1", name: "Priya Sharma", phone: "9876543210" },
        },
      ],
    });
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/owner phone/i), "9876543210");

    await waitFor(
      () => expect(screen.getByLabelText(/owner name/i)).toHaveValue("Priya Sharma"),
      { timeout: 1000 },
    );
    expect(screen.getByLabelText(/owner name/i)).toBeDisabled();
    expect(screen.getByText(/existing owner found/i)).toBeInTheDocument();
  });
});
