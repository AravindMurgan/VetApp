import { useQuery } from "@tanstack/react-query";
import { useFormContext } from "react-hook-form";
import {
  caseTypeSchema,
  type CaseTemplateListResponse,
  type CaseTemplateResponse,
  type Species,
} from "@vetlog/shared";
import { apiRequest } from "../../lib/api-client";
import { CASE_TYPE_LABELS } from "../../lib/case-type-labels";
import type { CaseFormInput } from "../../pages/new-case/form-types";

const CASE_TYPE_OPTIONS = caseTypeSchema.options;

interface CaseTypeStepProps {
  patientSpecies: Species;
  onApplyTemplate: (template: CaseTemplateResponse) => void;
}

export function CaseTypeStep({ patientSpecies, onApplyTemplate }: CaseTypeStepProps) {
  const { watch, setValue } = useFormContext<CaseFormInput>();
  const selectedType = watch("type");
  const selectedTemplateId = watch("templateId");

  const { data } = useQuery({
    queryKey: ["case-templates", selectedType],
    queryFn: () => apiRequest<CaseTemplateListResponse>(`/case-templates?caseType=${selectedType}`),
    enabled: Boolean(selectedType),
  });

  const relevantTemplates = (data?.templates ?? []).filter(
    (template) => template.species === null || template.species === patientSpecies,
  );

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Case type</h2>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Case type">
        {CASE_TYPE_OPTIONS.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => {
              setValue("type", type);
              setValue("templateId", undefined);
            }}
            aria-pressed={selectedType === type}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
              selectedType === type ? "border-primary bg-primary text-white" : "border-black/20"
            }`}
          >
            {CASE_TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      {selectedType && relevantTemplates.length > 0 ? (
        <div>
          <h3 className="text-sm font-semibold text-black/70">Template (optional)</h3>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Case template">
            {relevantTemplates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => onApplyTemplate(template)}
                aria-pressed={selectedTemplateId === template.id}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
                  selectedTemplateId === template.id
                    ? "border-primary bg-primary text-white"
                    : "border-black/20"
                }`}
              >
                {template.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
