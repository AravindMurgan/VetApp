import { useInstallPrompt } from "../hooks/use-install-prompt";

const MIN_VISITS_BEFORE_PROMPT = 3;

export function InstallPromptBanner({ visitCount }: { visitCount: number }) {
  const { canInstall, promptInstall, dismiss } = useInstallPrompt();

  if (visitCount < MIN_VISITS_BEFORE_PROMPT || !canInstall) {
    return null;
  }

  return (
    <div className="mt-4 flex items-center justify-between gap-2 rounded-md border border-primary/30 bg-primary/5 p-3">
      <p className="text-sm">Install VetLog for quick, full-screen access.</p>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={() => void promptInstall()}
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white"
        >
          Install
        </button>
        <button type="button" onClick={dismiss} className="text-sm font-medium text-black/60">
          Not now
        </button>
      </div>
    </div>
  );
}
