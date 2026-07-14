import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { WeightChart } from "./WeightChart";

describe("WeightChart", () => {
  it("shows an empty state with no entries", () => {
    render(<WeightChart entries={[]} />);
    expect(screen.getByText(/no weight recorded yet/i)).toBeInTheDocument();
  });

  it("renders the chart and labels the latest weight, regardless of input order", () => {
    render(
      <WeightChart
        entries={[
          { id: "w2", patientId: "p1", weightKg: "13.0", recordedAt: "2026-03-01T00:00:00.000Z", caseId: null },
          { id: "w1", patientId: "p1", weightKg: "12.0", recordedAt: "2026-01-01T00:00:00.000Z", caseId: null },
        ]}
      />,
    );

    expect(screen.getByRole("img")).toBeInTheDocument();
    expect(screen.getByText(/latest: 13.0 kg/i)).toBeInTheDocument();
  });

  it("renders a single data point without crashing", () => {
    render(
      <WeightChart
        entries={[
          { id: "w1", patientId: "p1", weightKg: "12.0", recordedAt: "2026-01-01T00:00:00.000Z", caseId: null },
        ]}
      />,
    );

    expect(screen.getByText(/latest: 12.0 kg/i)).toBeInTheDocument();
  });
});
