import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm, FormProvider, useFormContext } from "react-hook-form";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { VaccinePicker } from "./VaccinePicker";
import type { CaseFormInput } from "../../pages/new-case/form-types";

const apiRequestMock = vi.fn();

vi.mock("../../lib/api-client", () => ({
  apiRequest: (...args: unknown[]) => apiRequestMock(...args),
}));

function Probe() {
  const { watch } = useFormContext<CaseFormInput>();
  return <output data-testid="probe">{JSON.stringify(watch("vaccination"))}</output>;
}

function Wrapper() {
  const methods = useForm<CaseFormInput>({ defaultValues: { treatments: [] } });
  return (
    <FormProvider {...methods}>
      <VaccinePicker patientSpecies="DOG" />
      <Probe />
    </FormProvider>
  );
}

function renderPicker() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <Wrapper />
    </QueryClientProvider>,
  );
}

describe("VaccinePicker", () => {
  afterEach(() => {
    apiRequestMock.mockReset();
  });

  it("renders vaccine chips from active schedules", async () => {
    apiRequestMock.mockResolvedValue({
      vaccineSchedules: [
        {
          id: "s1",
          species: "DOG",
          vaccineName: "DHPPi",
          doses: [{ label: "1st dose", ageWeeks: 7 }],
          isPreset: true,
          isActive: true,
        },
      ],
    });
    renderPicker();

    expect(await screen.findByRole("button", { name: "DHPPi" })).toBeInTheDocument();
  });

  it("shows dose chips after selecting a vaccine, and sets the form value on dose selection", async () => {
    apiRequestMock.mockResolvedValue({
      vaccineSchedules: [
        {
          id: "s1",
          species: "DOG",
          vaccineName: "DHPPi",
          doses: [
            { label: "1st dose", ageWeeks: 7 },
            { label: "2nd dose", ageWeeks: 11 },
          ],
          isPreset: true,
          isActive: true,
        },
      ],
    });
    const user = userEvent.setup();
    renderPicker();

    await user.click(await screen.findByRole("button", { name: "DHPPi" }));
    await user.click(await screen.findByRole("button", { name: "1st dose" }));

    const probeText = screen.getByTestId("probe").textContent ?? "";
    expect(JSON.parse(probeText)).toEqual({ vaccineName: "DHPPi", doseLabel: "1st dose" });
  });
});
