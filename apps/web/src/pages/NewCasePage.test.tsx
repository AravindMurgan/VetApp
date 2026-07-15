import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import NewCasePage from "./NewCasePage";

const apiRequestMock = vi.fn();

vi.mock("../lib/api-client", () => ({
  apiRequest: (...args: unknown[]) => apiRequestMock(...args),
}));

const PATIENT = {
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
};

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/new-case"]}>
        <NewCasePage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("NewCasePage step navigation", () => {
  afterEach(() => {
    apiRequestMock.mockReset();
  });

  it("moves from patient selection to case type after picking a patient", async () => {
    apiRequestMock.mockResolvedValue({ patients: [PATIENT] });
    const user = userEvent.setup();
    renderPage();

    const patientButton = await screen.findByRole("button", { name: /Bruno/i });
    await user.click(patientButton);

    expect(await screen.findByRole("heading", { name: "Case type" })).toBeInTheDocument();
    expect(screen.getByText(/Bruno.*Priya Sharma/)).toBeInTheDocument();
  });

  it("disables Next on the case type step until a type is selected", async () => {
    apiRequestMock.mockResolvedValue({ patients: [PATIENT] });
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole("button", { name: /Bruno/i }));
    expect(await screen.findByRole("heading", { name: "Case type" })).toBeInTheDocument();

    expect(screen.getByRole("button", { name: /^next$/i })).toBeDisabled();

    apiRequestMock.mockResolvedValue({ templates: [] });
    await user.click(screen.getByRole("button", { name: "Consultation" }));

    expect(screen.getByRole("button", { name: /^next$/i })).toBeEnabled();
  });

  it("prefills complaint and treatments when a template is applied", async () => {
    apiRequestMock.mockImplementation((path: string) => {
      if (path.startsWith("/patients")) return Promise.resolve({ patients: [PATIENT] });
      if (path.startsWith("/case-templates")) {
        return Promise.resolve({
          templates: [
            {
              id: "t1",
              name: "Tick fever workup",
              caseType: "CONSULTATION",
              species: "DOG",
              defaults: {
                complaint: "Lethargy, suspected tick fever",
                treatmentLines: [{ drugName: "Doxycycline", dose: "5 mg/kg" }],
                followUpDays: 3,
              },
              isActive: true,
            },
          ],
        });
      }
      return Promise.resolve({});
    });
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole("button", { name: /Bruno/i }));
    await user.click(await screen.findByRole("button", { name: "Consultation" }));
    await user.click(await screen.findByRole("button", { name: "Tick fever workup" }));
    await user.click(screen.getByRole("button", { name: /^next$/i }));

    expect(await screen.findByLabelText(/complaint/i)).toHaveValue("Lethargy, suspected tick fever");
  });

  it("moves from Details to Treatments without submitting the case", async () => {
    apiRequestMock.mockResolvedValue({ patients: [PATIENT] });
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole("button", { name: /Bruno/i }));
    await user.click(await screen.findByRole("button", { name: "Consultation" }));
    await user.click(screen.getByRole("button", { name: /^next$/i }));

    expect(await screen.findByRole("heading", { name: "Details" })).toBeInTheDocument();
    apiRequestMock.mockReset();
    apiRequestMock.mockResolvedValue({ drugNames: [] });

    await user.click(screen.getByRole("button", { name: /^next$/i }));

    expect(await screen.findByRole("heading", { name: "Treatments" })).toBeInTheDocument();
    expect(apiRequestMock).not.toHaveBeenCalledWith(
      expect.stringContaining("/cases"),
      expect.objectContaining({ method: "POST" }),
    );
  });
});
