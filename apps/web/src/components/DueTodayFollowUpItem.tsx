import type { FollowUpSummaryResponse } from "@vetlog/shared";

export function DueTodayFollowUpItem({ followUp }: { followUp: FollowUpSummaryResponse }) {
  return (
    <li className="flex items-center justify-between rounded-md border border-black/10 p-3">
      <div>
        <p className="font-medium">{followUp.patient.name}</p>
        <p className="text-sm text-black/60">{followUp.owner.name}</p>
      </div>
      <a
        href={`tel:${followUp.owner.phone}`}
        className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white"
      >
        Call
      </a>
    </li>
  );
}
