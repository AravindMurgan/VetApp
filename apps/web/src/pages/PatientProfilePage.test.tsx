import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import PatientProfilePage from "./PatientProfilePage";

const apiRequestMock = vi.fn();

vi.mock("../lib/api-client", () => ({
  apiRequest: (...args: unknown[]) => apiRequestMock(...args),
}));

const OWNER = {
  id: "o1",
  name: "Priya Sharma",
  phone: "9876543210",
  altPhone: null,
  address: null,
  notes: null,
  createdAt: "2026-01-01T00:00:00.000Z",
};

function baseProfile(overrides: Record<string, unknown> = {}) {
  return {
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
    createdAt: "2026-01-01T00:00:00.000Z",
    owner: OWNER,
    cases: [],
    weights: [],
    vaccinations: [],
    attachments: [],
    ...overrides,
  };
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/patients/p1"]}>
        <Routes>
          <Route path="/patients/:id" element={<PatientProfilePage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("PatientProfilePage", () => {
  afterEach(() => {
    apiRequestMock.mockReset();
  });

  it("switches between tabs", async () => {
    apiRequestMock.mockResolvedValue(
      baseProfile({
        cases: [
          {
            id: "c1",
            patientId: "p1",
            type: "CONSULTATION",
            status: "OPEN",
            visitDate: "2026-01-05T00:00:00.000Z",
            complaint: "Vomiting",
            temperatureC: null,
            heartRate: null,
            respRate: null,
            clinicalNotes: null,
            diagnosis: null,
            templateId: null,
            createdAt: "2026-01-05T00:00:00.000Z",
          },
        ],
      }),
    );
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByText(/Vomiting/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Vaccinations" }));
    expect(screen.getByText(/no vaccinations recorded yet/i)).toBeInTheDocument();
    expect(screen.queryByText(/Vomiting/)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Weight" }));
    expect(screen.getByText(/no weight recorded yet/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Photos" }));
    expect(screen.getByText(/no photos yet/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Timeline" }));
    expect(screen.getByText(/Vomiting/)).toBeInTheDocument();
  });

  it("renders the timeline newest-first, as returned by the API", async () => {
    apiRequestMock.mockResolvedValue(
      baseProfile({
        cases: [
          {
            id: "c-newest",
            patientId: "p1",
            type: "CONSULTATION",
            status: "OPEN",
            visitDate: "2026-03-01T00:00:00.000Z",
            complaint: "Newest visit",
            temperatureC: null,
            heartRate: null,
            respRate: null,
            clinicalNotes: null,
            diagnosis: null,
            templateId: null,
            createdAt: "2026-03-01T00:00:00.000Z",
          },
          {
            id: "c-oldest",
            patientId: "p1",
            type: "CONSULTATION",
            status: "OPEN",
            visitDate: "2026-01-01T00:00:00.000Z",
            complaint: "Oldest visit",
            temperatureC: null,
            heartRate: null,
            respRate: null,
            clinicalNotes: null,
            diagnosis: null,
            templateId: null,
            createdAt: "2026-01-01T00:00:00.000Z",
          },
        ],
      }),
    );
    renderPage();

    await screen.findByText(/Newest visit/);
    const items = screen.getAllByRole("listitem");
    const texts = items.map((item) => item.textContent ?? "");

    const newestIndex = texts.findIndex((text) => text.includes("Newest visit"));
    const oldestIndex = texts.findIndex((text) => text.includes("Oldest visit"));
    expect(newestIndex).toBeLessThan(oldestIndex);
  });

  it("renders a deceased patient greyed out with a Deceased badge", async () => {
    apiRequestMock.mockResolvedValue(baseProfile({ status: "DECEASED" }));
    renderPage();

    await screen.findByText("Bruno");
    expect(screen.getByText("Deceased")).toBeInTheDocument();

    const main = document.querySelector("main");
    expect(main?.className).toContain("grayscale");
  });

  it("does not show a Deceased badge for an active patient", async () => {
    apiRequestMock.mockResolvedValue(baseProfile({ status: "ACTIVE" }));
    renderPage();

    await screen.findByText("Bruno");
    expect(screen.queryByText("Deceased")).not.toBeInTheDocument();
  });

  it("shows a thumbnail on the matching case in the timeline and lists all photos in the gallery", async () => {
    apiRequestMock.mockResolvedValue(
      baseProfile({
        cases: [
          {
            id: "c1",
            patientId: "p1",
            type: "CONSULTATION",
            status: "OPEN",
            visitDate: "2026-01-05T00:00:00.000Z",
            complaint: "Vomiting",
            temperatureC: null,
            heartRate: null,
            respRate: null,
            clinicalNotes: null,
            diagnosis: null,
            templateId: null,
            createdAt: "2026-01-05T00:00:00.000Z",
          },
        ],
        attachments: [
          {
            id: "a1",
            caseId: "c1",
            url: "https://pub-example.r2.dev/cases/c1/photo.jpg",
            thumbUrl: "https://pub-example.r2.dev/cases/c1/photo.jpg",
            createdAt: "2026-01-05T00:00:00.000Z",
          },
        ],
      }),
    );
    const user = userEvent.setup();
    renderPage();

    await screen.findByText(/Vomiting/);
    const timelineImages = screen.getAllByRole("img");
    expect(timelineImages).toHaveLength(1);
    expect(timelineImages[0]).toHaveAttribute("src", "https://pub-example.r2.dev/cases/c1/photo.jpg");

    await user.click(screen.getByRole("button", { name: "Photos" }));
    const galleryImages = screen.getAllByRole("img");
    expect(galleryImages).toHaveLength(1);
    expect(galleryImages[0]).toHaveAttribute("src", "https://pub-example.r2.dev/cases/c1/photo.jpg");
  });
});
