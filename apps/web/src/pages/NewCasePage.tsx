import { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type CaseCreate, type CaseTemplateResponse } from "@vetlog/shared";
import { apiRequest } from "../lib/api-client";
import { PatientStep } from "../components/new-case/PatientStep";
import { CaseTypeStep } from "../components/new-case/CaseTypeStep";
import { DetailsStep } from "../components/new-case/DetailsStep";
import { TreatmentsStep } from "../components/new-case/TreatmentsStep";
import {
  caseFormSchema,
  type CaseFormInput,
  type CaseFormOutput,
  type SelectedPatient,
} from "./new-case/form-types";

interface NewCaseLocationState {
  preselectedPatient?: SelectedPatient;
}

export default function NewCasePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const preselected = (location.state as NewCaseLocationState | null)?.preselectedPatient ?? null;
  const [step, setStep] = useState(preselected ? 2 : 1);
  const [selectedPatient, setSelectedPatient] = useState<SelectedPatient | null>(preselected);
  const [toast, setToast] = useState<string | null>(null);
  const isSubmittingRef = useRef(false);

  const formMethods = useForm<CaseFormInput, unknown, CaseFormOutput>({
    resolver: zodResolver(caseFormSchema),
    defaultValues: { treatments: [] },
  });

  const createCaseMutation = useMutation({
    mutationFn: (payload: CaseCreate) =>
      apiRequest(`/patients/${selectedPatient?.id}/cases`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  });

  function applyTemplate(template: CaseTemplateResponse) {
    formMethods.setValue("templateId", template.id);
    if (template.defaults.complaint) {
      formMethods.setValue("complaint", template.defaults.complaint);
    }
    if (template.defaults.diagnosis) {
      formMethods.setValue("diagnosis", template.defaults.diagnosis);
    }
    formMethods.setValue(
      "treatments",
      template.defaults.treatmentLines.map((line) => ({
        drugName: line.drugName,
        dose: line.dose,
        route: line.route,
        frequency: line.frequency,
        durationDays: line.durationDays,
        isProcedure: line.isProcedure ?? false,
      })),
    );
    if (template.defaults.followUpDays !== null) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + template.defaults.followUpDays);
      formMethods.setValue("followUp", { dueDate: dueDate.toISOString().slice(0, 10), reason: "REVISIT" });
    }
  }

  async function onSubmit(values: CaseFormOutput) {
    // Guards against a form submission being dispatched more than once for a
    // single Save tap (observed with react-hook-form's handleSubmit wrapper),
    // which would otherwise create duplicate cases.
    if (isSubmittingRef.current) {
      return;
    }
    isSubmittingRef.current = true;

    const { weightKg, ...rest } = values;
    const payload: CaseCreate = {
      ...rest,
      weightEntry: weightKg !== undefined ? { weightKg } : undefined,
    };

    try {
      await createCaseMutation.mutateAsync(payload);
    } catch {
      isSubmittingRef.current = false;
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ["dashboard-today"] });
    setToast("Case saved");
    setTimeout(() => navigate("/today", { replace: true }), 600);
  }

  const selectedType = formMethods.watch("type");
  const submitError = createCaseMutation.error;

  return (
    <main className="p-4 pb-24">
      <h1 className="text-xl font-semibold text-primary">New case</h1>
      {selectedPatient ? (
        <p className="mt-1 text-sm text-black/60">
          {selectedPatient.name} · {selectedPatient.owner.name}
        </p>
      ) : null}

      <FormProvider {...formMethods}>
        <form onSubmit={(event) => void formMethods.handleSubmit(onSubmit)(event)} noValidate className="mt-4">
          {step === 1 ? (
            <PatientStep
              onSelect={(patient) => {
                setSelectedPatient(patient);
                setStep(2);
              }}
            />
          ) : null}

          {step === 2 && selectedPatient ? (
            <CaseTypeStep patientSpecies={selectedPatient.species} onApplyTemplate={applyTemplate} />
          ) : null}

          {step === 3 ? <DetailsStep /> : null}

          {step === 4 ? <TreatmentsStep /> : null}

          {submitError ? (
            <p role="alert" className="mt-4 text-sm text-danger">
              Unable to save case. Please try again.
            </p>
          ) : null}

          {step > 1 ? (
            <div className="mt-6 flex justify-between">
              <button
                type="button"
                onClick={() => setStep((current) => current - 1)}
                className="rounded-md border border-black/20 px-4 py-2 text-sm font-medium"
              >
                Back
              </button>

              {step < 4 ? (
                <button
                  key="next"
                  type="button"
                  disabled={step === 2 && !selectedType}
                  onClick={() => setStep((current) => current + 1)}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  Next
                </button>
              ) : (
                <button
                  key="save"
                  type="submit"
                  disabled={formMethods.formState.isSubmitting}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  Save case
                </button>
              )}
            </div>
          ) : null}
        </form>
      </FormProvider>

      {toast ? (
        <div role="status" className="fixed inset-x-4 bottom-20 rounded-md bg-primary px-4 py-3 text-center text-white">
          {toast}
        </div>
      ) : null}
    </main>
  );
}
