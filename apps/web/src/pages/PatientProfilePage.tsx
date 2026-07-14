import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { PatientProfileResponse } from "@vetlog/shared";
import { apiRequest } from "../lib/api-client";
import { CASE_TYPE_LABELS } from "../lib/case-type-labels";
import { formatAge } from "../lib/format-age";
import { WeightChart } from "../components/WeightChart";

const TABS = [
  { value: "timeline", label: "Timeline" },
  { value: "vaccinations", label: "Vaccinations" },
  { value: "weight", label: "Weight" },
  { value: "photos", label: "Photos" },
] as const;

type Tab = (typeof TABS)[number]["value"];

export default function PatientProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<Tab>("timeline");

  const { data, isLoading } = useQuery({
    queryKey: ["patient-profile", id],
    queryFn: () => apiRequest<PatientProfileResponse>(`/patients/${id}`),
    enabled: Boolean(id),
  });

  if (isLoading || !data) {
    return (
      <main className="p-4 pb-24">
        <p className="text-black/50">Loading…</p>
      </main>
    );
  }

  const isDeceased = data.status === "DECEASED";

  return (
    <main className={`p-4 pb-24 ${isDeceased ? "opacity-60 grayscale" : ""}`}>
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold text-primary">{data.name}</h1>
        {isDeceased ? (
          <span className="rounded-full bg-black/10 px-2 py-0.5 text-xs font-medium text-black/70">
            Deceased
          </span>
        ) : null}
      </div>
      <p className="text-sm text-black/60">
        {data.species}
        {data.breed ? ` · ${data.breed}` : ""} · {formatAge(data.dateOfBirth, data.ageIsApprox)}
      </p>

      <div className="mt-2 flex items-center justify-between rounded-md border border-black/10 p-3">
        <p className="text-sm font-medium">{data.owner.name}</p>
        <a
          href={`tel:${data.owner.phone}`}
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white"
        >
          Call
        </a>
      </div>

      <div className="mt-4 flex gap-2" role="group" aria-label="Profile section">
        {TABS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setTab(option.value)}
            aria-pressed={tab === option.value}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
              tab === option.value ? "border-primary bg-primary text-white" : "border-black/20"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {tab === "timeline" ? (
        data.cases.length === 0 ? (
          <p className="mt-4 text-black/50">No cases logged yet.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {data.cases.map((caseItem) => (
              <li key={caseItem.id} className="rounded-md border border-black/10 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{CASE_TYPE_LABELS[caseItem.type]}</p>
                  <Link
                    to={`/cases/${caseItem.id}/prescription`}
                    className="text-sm font-medium text-primary underline"
                  >
                    Prescription
                  </Link>
                </div>
                <p className="text-sm text-black/60">
                  {new Date(caseItem.visitDate).toLocaleDateString()}
                  {caseItem.complaint ? ` · ${caseItem.complaint}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )
      ) : null}

      {tab === "vaccinations" ? (
        data.vaccinations.length === 0 ? (
          <p className="mt-4 text-black/50">No vaccinations recorded yet.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {data.vaccinations.map((record) => (
              <li key={record.id} className="rounded-md border border-black/10 p-3">
                <p className="font-medium">
                  {record.vaccineName} · {record.doseLabel}
                </p>
                <p className="text-sm text-black/60">
                  Given {new Date(record.givenAt).toLocaleDateString()}
                  {record.nextDueAt
                    ? ` · Next due ${new Date(record.nextDueAt).toLocaleDateString()}`
                    : ""}
                </p>
              </li>
            ))}
          </ul>
        )
      ) : null}

      {tab === "weight" ? (
        <div className="mt-4">
          <WeightChart entries={data.weights} />
        </div>
      ) : null}

      {tab === "photos" ? (
        <div className="mt-4">
          <p className="text-black/50">Photos coming soon.</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {[0, 1, 2, 3, 4, 5].map((placeholder) => (
              <div key={placeholder} className="aspect-square rounded-md bg-black/5" />
            ))}
          </div>
        </div>
      ) : null}
    </main>
  );
}
