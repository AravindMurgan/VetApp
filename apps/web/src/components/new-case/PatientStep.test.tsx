import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PatientStep } from "./PatientStep";

const apiRequestMock = vi.fn();

vi.mock("../../lib/api-client", () => ({
  apiRequest: (...args: unknown[]) => apiRequestMock(...args),
}));

function renderStep(onSelect = vi.fn()) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <PatientStep onSelect={onSelect} />
    </QueryClientProvider>,
  );
}

describe("PatientStep", () => {
  afterEach(() => {
    apiRequestMock.mockReset();
  });

  it("renders recent patients and calls onSelect when one is tapped", async () => {
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
    const onSelect = vi.fn();
    const user = userEvent.setup();
    renderStep(onSelect);

    const patientButton = await screen.findByRole("button", { name: /Bruno/i });
    await user.click(patientButton);

    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "p1", name: "Bruno" }));
  });

  it("shows the new-patient form when toggled", async () => {
    apiRequestMock.mockResolvedValue({ patients: [] });
    const user = userEvent.setup();
    renderStep();

    await user.click(screen.getByRole("button", { name: /new patient/i }));

    expect(screen.getByLabelText(/owner phone/i)).toBeInTheDocument();
  });
});
