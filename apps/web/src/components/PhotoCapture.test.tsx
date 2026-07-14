import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PhotoCapture } from "./PhotoCapture";

const apiRequestMock = vi.fn();
vi.mock("../lib/api-client", () => ({
  apiRequest: (...args: unknown[]) => apiRequestMock(...args),
}));

const compressImageMock = vi.fn();
vi.mock("../lib/compress-image", () => ({
  compressImage: (...args: unknown[]) => compressImageMock(...args),
}));

function renderComponent() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <PhotoCapture caseId="c1" patientId="p1" />
    </QueryClientProvider>,
  );
}

describe("PhotoCapture", () => {
  afterEach(() => {
    apiRequestMock.mockReset();
    compressImageMock.mockReset();
    vi.restoreAllMocks();
  });

  it("compresses the selected image before requesting an upload URL and uploading it", async () => {
    const originalFile = new File(["original"], "photo.png", { type: "image/png" });
    const compressedFile = new File(["compressed"], "photo.png", { type: "image/png" });
    compressImageMock.mockResolvedValue(compressedFile);
    apiRequestMock.mockResolvedValue({
      attachmentId: "a1",
      uploadUrl: "https://example-bucket.r2.cloudflarestorage.com/presigned",
      url: "https://pub-example.r2.dev/cases/c1/photo.png",
    });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    renderComponent();

    const input = screen.getByLabelText(/add photo/i);
    await user.upload(input, originalFile);

    await screen.findByRole("button", { name: /\+ add photo/i });

    expect(compressImageMock).toHaveBeenCalledWith(originalFile);
    expect(apiRequestMock).toHaveBeenCalledWith(
      "/cases/c1/attachments",
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "https://example-bucket.r2.cloudflarestorage.com/presigned",
      expect.objectContaining({ method: "PUT", body: compressedFile }),
    );

    const compressionOrder = compressImageMock.mock.invocationCallOrder[0]!;
    const apiRequestOrder = apiRequestMock.mock.invocationCallOrder[0]!;
    const fetchOrder = fetchMock.mock.invocationCallOrder[0]!;
    expect(compressionOrder).toBeLessThan(apiRequestOrder);
    expect(apiRequestOrder).toBeLessThan(fetchOrder);
  });

  it("shows an error message when the upload fails", async () => {
    const originalFile = new File(["original"], "photo.png", { type: "image/png" });
    compressImageMock.mockResolvedValue(originalFile);
    apiRequestMock.mockRejectedValue(new Error("network error"));

    const user = userEvent.setup();
    renderComponent();

    await user.upload(screen.getByLabelText(/add photo/i), originalFile);

    expect(await screen.findByRole("alert")).toHaveTextContent(/unable to upload photo/i);
  });
});
