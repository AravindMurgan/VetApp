import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm, FormProvider, useFormContext } from "react-hook-form";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TreatmentsStep } from "./TreatmentsStep";
import type { CaseFormInput } from "../../pages/new-case/form-types";

const apiRequestMock = vi.fn();

vi.mock("../../lib/api-client", () => ({
  apiRequest: (...args: unknown[]) => apiRequestMock(...args),
}));

function Probe() {
  const { watch } = useFormContext<CaseFormInput>();
  return <output data-testid="probe">{JSON.stringify(watch())}</output>;
}

function Wrapper() {
  const methods = useForm<CaseFormInput>({ defaultValues: { treatments: [] } });
  return (
    <FormProvider {...methods}>
      <TreatmentsStep />
      <Probe />
    </FormProvider>
  );
}

function renderStep() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <Wrapper />
    </QueryClientProvider>,
  );
}

describe("TreatmentsStep", () => {
  afterEach(() => {
    apiRequestMock.mockReset();
  });

  it("adds and removes a treatment row", async () => {
    apiRequestMock.mockResolvedValue({ drugNames: [] });
    const user = userEvent.setup();
    renderStep();

    expect(screen.queryByLabelText(/treatment 1 drug name/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /add treatment/i }));
    expect(screen.getByLabelText(/treatment 1 drug name/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /remove/i }));
    expect(screen.queryByLabelText(/treatment 1 drug name/i)).not.toBeInTheDocument();
  });

  it("sets a follow-up date when a preset chip is tapped", async () => {
    apiRequestMock.mockResolvedValue({ drugNames: [] });
    const user = userEvent.setup();
    renderStep();

    await user.click(screen.getByRole("button", { name: "1 week" }));

    const probeText = screen.getByTestId("probe").textContent ?? "";
    const parsed = JSON.parse(probeText);
    expect(parsed.followUp.reason).toBe("REVISIT");
    expect(typeof parsed.followUp.dueDate).toBe("string");
  });

  it("clears the follow-up when Clear is tapped", async () => {
    apiRequestMock.mockResolvedValue({ drugNames: [] });
    const user = userEvent.setup();
    renderStep();

    await user.click(screen.getByRole("button", { name: "3 days" }));
    expect(screen.getByRole("button", { name: /clear/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /clear/i }));
    expect(screen.queryByRole("button", { name: /clear/i })).not.toBeInTheDocument();
  });
});
