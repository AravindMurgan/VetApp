import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import LoginPage from "./LoginPage";

const loginMock = vi.fn();

vi.mock("../auth/auth-context", () => ({
  useAuth: () => ({
    status: "unauthenticated",
    user: null,
    login: loginMock,
    logout: vi.fn(),
  }),
}));

describe("LoginPage", () => {
  beforeEach(() => {
    loginMock.mockReset();
  });

  it("shows validation errors when submitting an empty form", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(await screen.findAllByRole("alert")).toHaveLength(2);
    expect(loginMock).not.toHaveBeenCalled();
  });

  it("shows a validation error for a too-short password", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/email/i), "vet@vetlog.local");
    await user.type(screen.getByLabelText(/password/i), "short");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(await screen.findAllByRole("alert")).toHaveLength(1);
    expect(loginMock).not.toHaveBeenCalled();
  });

  it("calls login with valid credentials and no validation errors", async () => {
    loginMock.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/email/i), "vet@vetlog.local");
    await user.type(screen.getByLabelText(/password/i), "longenoughpassword");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(loginMock).toHaveBeenCalledWith("vet@vetlog.local", "longenoughpassword");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
