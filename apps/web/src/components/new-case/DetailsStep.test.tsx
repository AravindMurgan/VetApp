import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm, FormProvider, useFormContext } from "react-hook-form";
import { DetailsStep } from "./DetailsStep";
import type { CaseFormInput } from "../../pages/new-case/form-types";

function Probe() {
  const { watch } = useFormContext<CaseFormInput>();
  return <output data-testid="probe">{JSON.stringify(watch())}</output>;
}

function Wrapper() {
  const methods = useForm<CaseFormInput>({ defaultValues: { treatments: [] } });
  return (
    <FormProvider {...methods}>
      <DetailsStep />
      <Probe />
    </FormProvider>
  );
}

describe("DetailsStep", () => {
  it("renders complaint, vitals, weight, diagnosis, and notes fields", () => {
    render(<Wrapper />);

    expect(screen.getByLabelText(/complaint/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Temp (°C)")).toBeInTheDocument();
    expect(screen.getByLabelText("Heart rate")).toBeInTheDocument();
    expect(screen.getByLabelText("Resp rate")).toBeInTheDocument();
    expect(screen.getByLabelText("Weight (kg)")).toBeInTheDocument();
    expect(screen.getByLabelText(/diagnosis/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
  });

  it("updates heart rate via the stepper", async () => {
    const user = userEvent.setup();
    render(<Wrapper />);

    await user.click(screen.getByRole("button", { name: /increase heart rate/i }));
    await user.click(screen.getByRole("button", { name: /increase heart rate/i }));

    expect(screen.getByTestId("probe")).toHaveTextContent('"heartRate":10');
  });

  it("types a complaint into the text field", async () => {
    const user = userEvent.setup();
    render(<Wrapper />);

    await user.type(screen.getByLabelText(/complaint/i), "Vomiting");

    expect(screen.getByTestId("probe")).toHaveTextContent('"complaint":"Vomiting"');
  });
});
