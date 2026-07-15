import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import type { CaseSummaryResponse } from "@vetlog/shared";
import { CaseCard } from "./CaseCard";

function baseCase(overrides: Partial<CaseSummaryResponse> = {}): CaseSummaryResponse {
  return {
    id: "c1",
    patientId: "p1",
    type: "CONSULTATION",
    status: "OPEN",
    visitDate: "2026-07-13T10:00:00.000Z",
    complaint: "Vomiting",
    temperatureC: null,
    heartRate: null,
    respRate: null,
    clinicalNotes: null,
    diagnosis: null,
    templateId: null,
    createdAt: "2026-07-13T10:00:00.000Z",
    patient: { id: "p1", name: "Bruno", species: "DOG" },
    weightKg: null,
    ...overrides,
  };
}

describe("CaseCard", () => {
  it("does not render a vitals line when nothing was recorded", () => {
    render(<CaseCard case={baseCase()} />);
    expect(screen.queryByText(/°C|HR|RR|kg/)).not.toBeInTheDocument();
  });

  it("renders recorded vitals and weight", () => {
    render(
      <CaseCard
        case={baseCase({ temperatureC: "38.5", heartRate: 120, respRate: 24, weightKg: "12.40" })}
      />,
    );
    expect(screen.getByText("38.5°C · HR 120 · RR 24 · 12.4 kg")).toBeInTheDocument();
  });

  it("renders only the vitals that were recorded", () => {
    render(<CaseCard case={baseCase({ heartRate: 90 })} />);
    expect(screen.getByText("HR 90")).toBeInTheDocument();
  });
});
