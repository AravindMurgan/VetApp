import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { DashboardTodayResponse } from "@vetlog/shared";
import { apiRequest } from "../lib/api-client";
import { CaseCard } from "../components/CaseCard";
import { DueTodayFollowUpItem } from "../components/DueTodayFollowUpItem";

export default function TodayPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-today"],
    queryFn: () => apiRequest<DashboardTodayResponse>("/dashboard/today"),
  });

  return (
    <main className="p-4 pb-24">
      <h1 className="text-xl font-semibold text-primary">Today</h1>
      {data ? <p className="text-sm text-black/60">{data.date}</p> : null}

      {isLoading ? (
        <p className="mt-4 text-black/50">Loading…</p>
      ) : data ? (
        <>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-md border border-black/10 p-3 text-center">
              <p className="text-2xl font-semibold text-primary">{data.casesToday.length}</p>
              <p className="text-xs text-black/60">Cases today</p>
            </div>
            <div className="rounded-md border border-black/10 p-3 text-center">
              <p className="text-2xl font-semibold text-primary">{data.followUpCounts.dueToday}</p>
              <p className="text-xs text-black/60">Due today</p>
            </div>
            <div
              data-testid="overdue-counter"
              className={`rounded-md border p-3 text-center ${
                data.followUpCounts.overdue > 0 ? "border-danger bg-danger/10" : "border-black/10"
              }`}
            >
              <p
                className={`text-2xl font-semibold ${
                  data.followUpCounts.overdue > 0 ? "text-danger" : "text-primary"
                }`}
              >
                {data.followUpCounts.overdue}
              </p>
              <p className="text-xs text-black/60">Overdue</p>
            </div>
          </div>

          {data.followUpsDueToday.length > 0 ? (
            <section className="mt-6">
              <h2 className="text-sm font-semibold text-black/70">Due today</h2>
              <ul className="mt-2 space-y-2">
                {data.followUpsDueToday.map((followUp) => (
                  <DueTodayFollowUpItem key={followUp.id} followUp={followUp} />
                ))}
              </ul>
            </section>
          ) : null}

          <section className="mt-6">
            <h2 className="text-sm font-semibold text-black/70">Today&rsquo;s cases</h2>
            {data.casesToday.length === 0 ? (
              <p className="mt-2 text-black/50">No cases yet today — tap + to log the first</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {data.casesToday.map((caseSummary) => (
                  <CaseCard key={caseSummary.id} case={caseSummary} />
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}

      <Link
        to="/new-case"
        aria-label="New Case"
        className="fixed bottom-20 right-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-2xl text-white shadow-lg"
      >
        +
      </Link>
    </main>
  );
}
