import { afterEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi } from "vitest";
import CasePrescriptionPage from "./CasePrescriptionPage";

const apiRequestMock = vi.fn();

vi.mock("../lib/api-client", () => ({
  apiRequest: (...args: unknown[]) => apiRequestMock(...args),
}));

function basePrescription(overrides: Record<string, unknown> = {}) {
  return {
    case: {
      id: "c1",
      patientId: "p1",
      type: "CONSULTATION",
      status: "OPEN",
      visitDate: "2026-07-14T00:00:00.000Z",
      complaint: "Vomiting",
      temperatureC: null,
      heartRate: null,
      respRate: null,
      clinicalNotes: "Bland diet for 3 days.",
      diagnosis: "Gastritis",
      templateId: null,
      createdAt: "2026-07-14T00:00:00.000Z",
    },
    treatments: [
      {
        id: "t1",
        caseId: "c1",
        drugName: "Metronidazole",
        dose: "50 mg",
        route: "PO",
        frequency: "BID",
        durationDays: 5,
        instructions: "Give with food",
        isProcedure: false,
      },
      {
        id: "t2",
        caseId: "c1",
        drugName: "Ranitidine",
        dose: "10 mg",
        route: "PO",
        frequency: "SID",
        durationDays: 3,
        instructions: null,
        isProcedure: false,
      },
    ],
    recheckFollowUp: null,
    patient: {
      id: "p1",
      ownerId: "o1",
      name: "Bruno",
      species: "DOG",
      breed: "Labrador",
      sex: "UNKNOWN",
      dateOfBirth: null,
      ageIsApprox: false,
      colorMarkings: null,
      microchipId: null,
      status: "ACTIVE",
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    owner: {
      id: "o1",
      name: "Priya Sharma",
      phone: "9876543210",
      altPhone: null,
      address: null,
      notes: null,
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    clinic: {
      clinicName: "VetLog Clinic",
      clinicAddress: "12 Park Street",
      clinicPhone: "5551234567",
      vetRegistrationNumber: "VET-9981",
    },
    ...overrides,
  };
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/cases/c1/prescription"]}>
        <Routes>
          <Route path="/cases/:id/prescription" element={<CasePrescriptionPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("CasePrescriptionPage", () => {
  afterEach(() => {
    apiRequestMock.mockReset();
  });

  it("renders every treatment line with dose, route, frequency, and duration", async () => {
    apiRequestMock.mockResolvedValue(basePrescription());
    renderPage();

    await screen.findByText("Metronidazole");
    expect(screen.getByText(/50 mg.*PO.*BID.*5 day/)).toBeInTheDocument();
    expect(screen.getByText("Ranitidine")).toBeInTheDocument();
    expect(screen.getByText(/10 mg.*PO.*SID.*3 day/)).toBeInTheDocument();
  });

  it("renders the clinic header, patient/owner block, advice, and signature space", async () => {
    apiRequestMock.mockResolvedValue(basePrescription());
    renderPage();

    await screen.findByText("VetLog Clinic");
    expect(screen.getByText("12 Park Street")).toBeInTheDocument();
    expect(screen.getByText(/VET-9981/)).toBeInTheDocument();
    expect(screen.getByText("Bruno")).toBeInTheDocument();
    expect(screen.getByText("Priya Sharma")).toBeInTheDocument();
    expect(screen.getByText(/Bland diet for 3 days/)).toBeInTheDocument();
    expect(screen.getByText("Signature")).toBeInTheDocument();
  });

  it("shows the recheck date when a RECHECK follow-up is linked", async () => {
    apiRequestMock.mockResolvedValue(
      basePrescription({
        recheckFollowUp: {
          id: "f1",
          caseId: "c1",
          patientId: "p1",
          dueDate: "2026-07-21T00:00:00.000Z",
          reason: "RECHECK",
          notes: null,
          status: "PENDING",
        },
      }),
    );
    renderPage();

    expect(await screen.findByText(/Recheck due/)).toBeInTheDocument();
  });

  it("has a Print / Save PDF button", async () => {
    apiRequestMock.mockResolvedValue(basePrescription());
    renderPage();

    expect(await screen.findByRole("button", { name: /print.*save pdf/i })).toBeInTheDocument();
  });

  it("matches the print markup snapshot", async () => {
    apiRequestMock.mockResolvedValue(basePrescription());
    const { container } = renderPage();

    await screen.findByText("Metronidazole");
    expect(container).toMatchSnapshot();
  });
});
