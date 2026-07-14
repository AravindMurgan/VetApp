import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm, FormProvider } from "react-hook-form";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CaseTypeStep } from "./CaseTypeStep";
import type { CaseFormInput } from "../../pages/new-case/form-types";

const apiRequestMock = vi.fn();

vi.mock("../../lib/api-client", () => ({
  apiRequest: (...args: unknown[]) => apiRequestMock(...args),
}));

function Wrapper({ onApplyTemplate }: { onApplyTemplate: (template: unknown) => void }) {
  const methods = useForm<CaseFormInput>({ defaultValues: { treatments: [] } });
  return (
    <FormProvider {...methods}>
      <CaseTypeStep patientSpecies="DOG" onApplyTemplate={onApplyTemplate as never} />
    </FormProvider>
  );
}

function renderStep(onApplyTemplate = vi.fn()) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <Wrapper onApplyTemplate={onApplyTemplate} />
    </QueryClientProvider>,
  );
}

describe("CaseTypeStep", () => {
  afterEach(() => {
    apiRequestMock.mockReset();
  });

  it("renders all six case type chips", () => {
    renderStep();

    expect(screen.getByRole("button", { name: "Consultation" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Vaccination" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Surgery" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Emergency" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Follow-up" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Grooming / health check" })).toBeInTheDocument();
  });

  it("fetches and shows templates matching the selected type and patient species", async () => {
    apiRequestMock.mockResolvedValue({
      templates: [
        {
          id: "t1",
          name: "Vaccination visit",
          caseType: "VACCINATION",
          species: null,
          defaults: { treatmentLines: [], followUpDays: null },
          isActive: true,
        },
        {
          id: "t2",
          name: "Cat-only template",
          caseType: "VACCINATION",
          species: "CAT",
          defaults: { treatmentLines: [], followUpDays: null },
          isActive: true,
        },
      ],
    });
    const user = userEvent.setup();
    renderStep();

    await user.click(screen.getByRole("button", { name: "Vaccination" }));

    expect(await screen.findByRole("button", { name: "Vaccination visit" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cat-only template" })).not.toBeInTheDocument();
  });

  it("calls onApplyTemplate when a template chip is tapped", async () => {
    apiRequestMock.mockResolvedValue({
      templates: [
        {
          id: "t1",
          name: "Vaccination visit",
          caseType: "VACCINATION",
          species: null,
          defaults: { treatmentLines: [], followUpDays: null },
          isActive: true,
        },
      ],
    });
    const onApplyTemplate = vi.fn();
    const user = userEvent.setup();
    renderStep(onApplyTemplate);

    await user.click(screen.getByRole("button", { name: "Vaccination" }));
    const templateButton = await screen.findByRole("button", { name: "Vaccination visit" });
    await user.click(templateButton);

    expect(onApplyTemplate).toHaveBeenCalledWith(expect.objectContaining({ id: "t1" }));
  });
});
