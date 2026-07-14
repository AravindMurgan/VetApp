import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InstallPromptBanner } from "./InstallPromptBanner";

const useInstallPromptMock = vi.fn();
vi.mock("../hooks/use-install-prompt", () => ({
  useInstallPrompt: () => useInstallPromptMock(),
}));

describe("InstallPromptBanner", () => {
  afterEach(() => {
    useInstallPromptMock.mockReset();
  });

  it("renders nothing before the third visit, even if install is available", () => {
    useInstallPromptMock.mockReturnValue({ canInstall: true, promptInstall: vi.fn(), dismiss: vi.fn() });
    const { container } = render(<InstallPromptBanner visitCount={2} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing on the third visit if the browser has no install prompt available", () => {
    useInstallPromptMock.mockReturnValue({ canInstall: false, promptInstall: vi.fn(), dismiss: vi.fn() });
    const { container } = render(<InstallPromptBanner visitCount={3} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the install banner on the third visit when install is available", () => {
    useInstallPromptMock.mockReturnValue({ canInstall: true, promptInstall: vi.fn(), dismiss: vi.fn() });
    render(<InstallPromptBanner visitCount={3} />);
    expect(screen.getByText(/install vetlog/i)).toBeInTheDocument();
  });

  it("calls promptInstall when Install is clicked", async () => {
    const promptInstall = vi.fn();
    useInstallPromptMock.mockReturnValue({ canInstall: true, promptInstall, dismiss: vi.fn() });
    const user = userEvent.setup();
    render(<InstallPromptBanner visitCount={5} />);

    await user.click(screen.getByRole("button", { name: "Install" }));
    expect(promptInstall).toHaveBeenCalled();
  });

  it("calls dismiss when Not now is clicked", async () => {
    const dismiss = vi.fn();
    useInstallPromptMock.mockReturnValue({ canInstall: true, promptInstall: vi.fn(), dismiss });
    const user = userEvent.setup();
    render(<InstallPromptBanner visitCount={5} />);

    await user.click(screen.getByRole("button", { name: /not now/i }));
    expect(dismiss).toHaveBeenCalled();
  });
});
