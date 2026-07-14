import type { FollowUpSummaryResponse } from "@vetlog/shared";

interface FollowUpRowProps {
  followUp: FollowUpSummaryResponse;
  onMarkDone: (id: string) => void;
  isMarkingDone: boolean;
}

export function FollowUpRow({ followUp, onMarkDone, isMarkingDone }: FollowUpRowProps) {
  return (
    <li className="flex items-center justify-between rounded-md border border-black/10 p-3">
      <div>
        <p className="font-medium">{followUp.patient.name}</p>
        <p className="text-sm text-black/60">{followUp.owner.name}</p>
      </div>
      <div className="flex items-center gap-2">
        <a
          href={`tel:${followUp.owner.phone}`}
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white"
        >
          Call
        </a>
        <button
          type="button"
          onClick={() => onMarkDone(followUp.id)}
          disabled={isMarkingDone}
          className="rounded-md border border-black/20 px-3 py-1.5 text-sm font-medium disabled:opacity-50"
        >
          Done
        </button>
      </div>
    </li>
  );
}
