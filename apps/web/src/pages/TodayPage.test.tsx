import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import TodayPage from "./TodayPage";

const apiRequestMock = vi.fn();

vi.mock("../lib/api-client", () => ({
  apiRequest: (...args: unknown[]) => apiRequestMock(...args),
}));

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <TodayPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const CASE_SUMMARY = {
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
};

describe("TodayPage", () => {
  afterEach(() => {
    apiRequestMock.mockReset();
  });

  it("shows the empty state when there are no cases yet today", async () => {
    apiRequestMock.mockResolvedValue({
      date: "2026-07-13",
      casesToday: [],
      followUpsDueToday: [],
      followUpCounts: { dueToday: 0, overdue: 0 },
    });
    renderPage();

    expect(await screen.findByText(/no cases yet today/i)).toBeInTheDocument();
  });

  it("renders case cards instead of the empty state when cases exist", async () => {
    apiRequestMock.mockResolvedValue({
      date: "2026-07-13",
      casesToday: [CASE_SUMMARY],
      followUpsDueToday: [],
      followUpCounts: { dueToday: 0, overdue: 0 },
    });
    renderPage();

    expect(await screen.findByText("Bruno")).toBeInTheDocument();
    expect(screen.queryByText(/no cases yet today/i)).not.toBeInTheDocument();
  });

  it("styles the overdue counter as neutral when there are no overdue follow-ups", async () => {
    apiRequestMock.mockResolvedValue({
      date: "2026-07-13",
      casesToday: [],
      followUpsDueToday: [],
      followUpCounts: { dueToday: 0, overdue: 0 },
    });
    renderPage();

    const counter = await screen.findByTestId("overdue-counter");
    expect(counter.className).not.toContain("border-danger");
  });

  it("styles the overdue counter as danger when there are overdue follow-ups", async () => {
    apiRequestMock.mockResolvedValue({
      date: "2026-07-13",
      casesToday: [],
      followUpsDueToday: [],
      followUpCounts: { dueToday: 0, overdue: 3 },
    });
    renderPage();

    const counter = await screen.findByTestId("overdue-counter");
    expect(counter.className).toContain("border-danger");
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders a call link with the owner's phone number for due-today follow-ups", async () => {
    apiRequestMock.mockResolvedValue({
      date: "2026-07-13",
      casesToday: [],
      followUpsDueToday: [
        {
          id: "f1",
          caseId: null,
          patientId: "p1",
          dueDate: "2026-07-13T00:00:00.000Z",
          reason: "RECHECK",
          notes: null,
          status: "PENDING",
          patient: { id: "p1", name: "Bruno", species: "DOG" },
          owner: { id: "o1", name: "Priya Sharma", phone: "9876543210" },
        },
      ],
      followUpCounts: { dueToday: 1, overdue: 0 },
    });
    renderPage();

    const callLink = await screen.findByRole("link", { name: /call/i });
    expect(callLink).toHaveAttribute("href", "tel:9876543210");
  });

  it("renders a New Case link", async () => {
    apiRequestMock.mockResolvedValue({
      date: "2026-07-13",
      casesToday: [],
      followUpsDueToday: [],
      followUpCounts: { dueToday: 0, overdue: 0 },
    });
    renderPage();

    expect(await screen.findByRole("link", { name: /new case/i })).toHaveAttribute(
      "href",
      "/new-case",
    );
  });
});
