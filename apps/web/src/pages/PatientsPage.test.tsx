import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import PatientsPage from "./PatientsPage";

const apiRequestMock = vi.fn();

vi.mock("../lib/api-client", () => ({
  apiRequest: (...args: unknown[]) => apiRequestMock(...args),
}));

function renderPatientsPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <PatientsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("PatientsPage search", () => {
  afterEach(() => {
    apiRequestMock.mockReset();
  });

  it("debounces rapid typing into a single query", async () => {
    apiRequestMock.mockResolvedValue({ patients: [] });
    const user = userEvent.setup();

    renderPatientsPage();

    await waitFor(() => expect(apiRequestMock).toHaveBeenCalledTimes(1));
    apiRequestMock.mockClear();

    await user.type(screen.getByLabelText(/search patients/i), "bruno");

    await waitFor(() => expect(apiRequestMock).toHaveBeenCalledTimes(1), { timeout: 1000 });
    expect(apiRequestMock).toHaveBeenCalledWith(expect.stringContaining("search=bruno"));
  });

  it("renders search results with species chips", async () => {
    apiRequestMock.mockResolvedValue({
      patients: [
        {
          id: "p1",
          ownerId: "o1",
          name: "Bruno",
          species: "DOG",
          breed: null,
          sex: "UNKNOWN",
          dateOfBirth: null,
          ageIsApprox: false,
          colorMarkings: null,
          microchipId: null,
          status: "ACTIVE",
          createdAt: "2026-07-13T00:00:00.000Z",
          owner: { id: "o1", name: "Priya Sharma", phone: "9876543210" },
        },
      ],
    });

    renderPatientsPage();

    expect(await screen.findByText("Bruno")).toBeInTheDocument();
    expect(screen.getByText("Dog")).toBeInTheDocument();
    expect(screen.getByText(/Priya Sharma/)).toBeInTheDocument();
  });
});
