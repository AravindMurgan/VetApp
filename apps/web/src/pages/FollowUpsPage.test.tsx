import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import FollowUpsPage from "./FollowUpsPage";

const apiRequestMock = vi.fn();

vi.mock("../lib/api-client", () => ({
  apiRequest: (...args: unknown[]) => apiRequestMock(...args),
}));

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <FollowUpsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const FOLLOW_UP = {
  id: "f1",
  caseId: null,
  patientId: "p1",
  dueDate: "2026-07-10T00:00:00.000Z",
  reason: "RECHECK",
  notes: null,
  status: "PENDING",
  patient: { id: "p1", name: "Bruno", species: "DOG" },
  owner: { id: "o1", name: "Priya Sharma", phone: "9876543210" },
};

describe("FollowUpsPage", () => {
  afterEach(() => {
    apiRequestMock.mockReset();
  });

  it("defaults to the Overdue bucket and fetches it", async () => {
    apiRequestMock.mockResolvedValue({ followUps: [] });
    renderPage();

    expect(await screen.findByText(/no follow-ups in this bucket/i)).toBeInTheDocument();
    expect(apiRequestMock).toHaveBeenCalledWith(expect.stringContaining("bucket=overdue"));
  });

  it("switches buckets when a segment is tapped", async () => {
    apiRequestMock.mockResolvedValue({ followUps: [] });
    const user = userEvent.setup();
    renderPage();

    await screen.findByText(/no follow-ups in this bucket/i);
    apiRequestMock.mockClear();

    await user.click(screen.getByRole("button", { name: "Upcoming" }));

    expect(apiRequestMock).toHaveBeenCalledWith(expect.stringContaining("bucket=upcoming"));
  });

  it("renders a follow-up with a call link and a Done button", async () => {
    apiRequestMock.mockResolvedValue({ followUps: [FOLLOW_UP] });
    renderPage();

    expect(await screen.findByText("Bruno")).toBeInTheDocument();
    const callLink = screen.getByRole("link", { name: /call/i });
    expect(callLink).toHaveAttribute("href", "tel:9876543210");
    expect(screen.getByRole("button", { name: /done/i })).toBeInTheDocument();
  });

  it("marks a follow-up done and shows a log-a-case prompt", async () => {
    apiRequestMock.mockImplementation((path: string, options?: { method?: string }) => {
      if (options?.method === "PATCH") {
        return Promise.resolve({ ...FOLLOW_UP, status: "DONE" });
      }
      return Promise.resolve({ followUps: [FOLLOW_UP] });
    });
    const user = userEvent.setup();
    renderPage();

    await screen.findByText("Bruno");
    await user.click(screen.getByRole("button", { name: /done/i }));

    expect(await screen.findByText(/marked bruno done/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /log a case/i })).toHaveAttribute("href", "/new-case");
  });
});
