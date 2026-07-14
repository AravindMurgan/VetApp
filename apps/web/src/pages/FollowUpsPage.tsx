import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { FollowUpBucket, FollowUpListResponse, FollowUpSummaryResponse } from "@vetlog/shared";
import { apiRequest } from "../lib/api-client";
import { FollowUpRow } from "../components/FollowUpRow";

const BUCKETS: { value: FollowUpBucket; label: string }[] = [
  { value: "overdue", label: "Overdue" },
  { value: "today", label: "Today" },
  { value: "upcoming", label: "Upcoming" },
];

export default function FollowUpsPage() {
  const [bucket, setBucket] = useState<FollowUpBucket>("overdue");
  const [justCompleted, setJustCompleted] = useState<FollowUpSummaryResponse | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["followups", bucket],
    queryFn: () => apiRequest<FollowUpListResponse>(`/followups?bucket=${bucket}`),
  });

  const markDoneMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/followups/${id}`, { method: "PATCH", body: JSON.stringify({ status: "DONE" }) }),
    onSuccess: async (_response, id) => {
      const completed = data?.followUps.find((followUp) => followUp.id === id) ?? null;
      setJustCompleted(completed);
      await queryClient.invalidateQueries({ queryKey: ["followups"] });
    },
  });

  return (
    <main className="p-4 pb-24">
      <h1 className="text-xl font-semibold text-primary">Follow-ups</h1>

      <div className="mt-4 flex gap-2" role="group" aria-label="Follow-up bucket">
        {BUCKETS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              setBucket(option.value);
              setJustCompleted(null);
            }}
            aria-pressed={bucket === option.value}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
              bucket === option.value ? "border-primary bg-primary text-white" : "border-black/20"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {justCompleted ? (
        <div className="mt-4 flex items-center justify-between rounded-md bg-primary/10 p-3">
          <p className="text-sm text-primary">Marked {justCompleted.patient.name} done.</p>
          <Link
            to="/new-case"
            state={{
              preselectedPatient: {
                id: justCompleted.patient.id,
                name: justCompleted.patient.name,
                species: justCompleted.patient.species,
                owner: { name: justCompleted.owner.name },
              },
            }}
            className="text-sm font-medium text-primary underline"
          >
            + Log a case
          </Link>
        </div>
      ) : null}

      {isLoading ? (
        <p className="mt-4 text-black/50">Loading…</p>
      ) : data && data.followUps.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {data.followUps.map((followUp) => (
            <FollowUpRow
              key={followUp.id}
              followUp={followUp}
              onMarkDone={(id) => markDoneMutation.mutate(id)}
              isMarkingDone={markDoneMutation.isPending && markDoneMutation.variables === followUp.id}
            />
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-black/50">No follow-ups in this bucket.</p>
      )}
    </main>
  );
}
