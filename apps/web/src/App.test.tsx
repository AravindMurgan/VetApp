import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "./App";

vi.mock("./auth/auth-context", () => ({
  useAuth: () => ({
    status: "authenticated",
    user: { id: "1", email: "vet@vetlog.local", clinicName: "Test Clinic" },
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

vi.mock("./lib/api-client", () => ({
  apiRequest: vi.fn().mockResolvedValue({ patients: [] }),
}));

function renderApp() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/today"]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("App bottom tab navigation", () => {
  it("renders all four tabs", () => {
    renderApp();

    expect(screen.getByRole("heading", { name: "Today" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /today/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /patients/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /follow-ups/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /more/i })).toBeInTheDocument();
  });

  it("navigates to the Patients page when its tab is clicked", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("link", { name: /patients/i }));

    expect(await screen.findByRole("heading", { name: "Patients" })).toBeInTheDocument();
  });

  it("navigates to the Follow-ups page when its tab is clicked", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("link", { name: /follow-ups/i }));

    expect(await screen.findByRole("heading", { name: "Follow-ups" })).toBeInTheDocument();
  });
});
