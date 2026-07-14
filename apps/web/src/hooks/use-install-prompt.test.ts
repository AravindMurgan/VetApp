import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useInstallPrompt } from "./use-install-prompt";

function makeBeforeInstallPromptEvent() {
  const event = new Event("beforeinstallprompt", { cancelable: true }) as Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
  };
  event.prompt = vi.fn().mockResolvedValue(undefined);
  event.userChoice = Promise.resolve({ outcome: "accepted" });
  return event;
}

describe("useInstallPrompt", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts with canInstall false", () => {
    const { result } = renderHook(() => useInstallPrompt());
    expect(result.current.canInstall).toBe(false);
  });

  it("becomes installable after beforeinstallprompt fires, and prevents the default mini-infobar", () => {
    const { result } = renderHook(() => useInstallPrompt());
    const event = makeBeforeInstallPromptEvent();
    const preventDefaultSpy = vi.spyOn(event, "preventDefault");

    act(() => {
      window.dispatchEvent(event);
    });

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(result.current.canInstall).toBe(true);
  });

  it("promptInstall calls prompt() and clears availability afterwards", async () => {
    const { result } = renderHook(() => useInstallPrompt());
    const event = makeBeforeInstallPromptEvent();

    act(() => {
      window.dispatchEvent(event);
    });
    expect(result.current.canInstall).toBe(true);

    await act(async () => {
      await result.current.promptInstall();
    });

    expect(event.prompt).toHaveBeenCalled();
    expect(result.current.canInstall).toBe(false);
  });

  it("dismiss persists across remounts via localStorage", () => {
    const { result, unmount } = renderHook(() => useInstallPrompt());
    const event = makeBeforeInstallPromptEvent();

    act(() => {
      window.dispatchEvent(event);
    });
    act(() => {
      result.current.dismiss();
    });
    expect(result.current.canInstall).toBe(false);
    unmount();

    const { result: secondResult } = renderHook(() => useInstallPrompt());
    act(() => {
      window.dispatchEvent(makeBeforeInstallPromptEvent());
    });
    expect(secondResult.current.canInstall).toBe(false);
  });
});
