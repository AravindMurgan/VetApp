import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { PatientProfileResponse } from "@vetlog/shared";
import { apiRequest } from "../lib/api-client";
import { CASE_TYPE_LABELS } from "../lib/case-type-labels";
import { formatAge } from "../lib/format-age";
import { WeightChart } from "../components/WeightChart";
import { PhotoCapture } from "../components/PhotoCapture";

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
            {data.cases.map((caseItem) => {
              const caseAttachments = data.attachments.filter(
                (attachment) => attachment.caseId === caseItem.id,
              );
              return (
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
                  {caseAttachments.length > 0 ? (
                    <div className="mt-2 flex gap-1">
                      {caseAttachments.map((attachment) => (
                        <img
                          key={attachment.id}
                          src={attachment.thumbUrl ?? attachment.url}
                          alt={`${data.name} photo`}
                          className="h-12 w-12 rounded-md object-cover"
                        />
                      ))}
                    </div>
                  ) : null}
                  <div className="mt-2">
                    <PhotoCapture caseId={caseItem.id} patientId={id ?? ""} />
                  </div>
                </li>
              );
            })}
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
          {data.attachments.length === 0 ? (
            <p className="text-black/50">No photos yet.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {data.attachments.map((attachment) => (
                <img
                  key={attachment.id}
                  src={attachment.url}
                  alt={`${data.name} photo`}
                  className="aspect-square rounded-md object-cover"
                />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </main>
  );
}
