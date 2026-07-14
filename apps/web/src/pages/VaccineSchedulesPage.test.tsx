import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import VaccineSchedulesPage from "./VaccineSchedulesPage";

const apiRequestMock = vi.fn();

vi.mock("../lib/api-client", () => ({
  apiRequest: (...args: unknown[]) => apiRequestMock(...args),
}));

const SCHEDULE = {
  id: "s1",
  species: "DOG",
  vaccineName: "DHPPi",
  doses: [{ label: "1st dose", ageWeeks: 7 }],
  isPreset: true,
  isActive: true,
};

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <VaccineSchedulesPage />
    </QueryClientProvider>,
  );
}

describe("VaccineSchedulesPage", () => {
  afterEach(() => {
    apiRequestMock.mockReset();
  });

  it("lists vaccine schedules with species and dose count", async () => {
    apiRequestMock.mockResolvedValue({ vaccineSchedules: [SCHEDULE] });
    renderPage();

    expect(await screen.findByText(/DHPPi/)).toBeInTheDocument();
    expect(screen.getByText(/1 dose\(s\)/)).toBeInTheDocument();
  });

  it("toggles a schedule's active checkbox", async () => {
    apiRequestMock.mockResolvedValue({ vaccineSchedules: [SCHEDULE] });
    const user = userEvent.setup();
    renderPage();

    const checkbox = await screen.findByRole("checkbox", { name: /active/i });
    expect(checkbox).toBeChecked();

    await user.click(checkbox);

    expect(apiRequestMock).toHaveBeenCalledWith(
      "/vaccine-schedules/s1",
      expect.objectContaining({ method: "PATCH", body: JSON.stringify({ isActive: false }) }),
    );
  });

  it("expands the dose editor and allows editing a dose label", async () => {
    apiRequestMock.mockResolvedValue({ vaccineSchedules: [SCHEDULE] });
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole("button", { name: /edit doses/i }));

    const labelInput = screen.getByLabelText(/dose 1 label/i);
    expect(labelInput).toHaveValue("1st dose");

    await user.clear(labelInput);
    await user.type(labelInput, "First dose");
    expect(labelInput).toHaveValue("First dose");
  });

  it("saves edited doses", async () => {
    apiRequestMock.mockResolvedValue({ vaccineSchedules: [SCHEDULE] });
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole("button", { name: /edit doses/i }));
    await user.click(screen.getByRole("button", { name: /save doses/i }));

    expect(apiRequestMock).toHaveBeenCalledWith(
      "/vaccine-schedules/s1",
      expect.objectContaining({ method: "PATCH" }),
    );
    expect(await screen.findByText(/saved/i)).toBeInTheDocument();
  });
});
