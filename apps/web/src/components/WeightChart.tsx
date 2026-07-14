import type { WeightEntryResponse } from "@vetlog/shared";

const CHART_WIDTH = 300;
const CHART_HEIGHT = 120;
const PADDING = 16;

export function WeightChart({ entries }: { entries: WeightEntryResponse[] }) {
  if (entries.length === 0) {
    return <p className="text-black/50">No weight recorded yet.</p>;
  }

  // Entries arrive newest-first from the API; the chart reads left-to-right in time.
  const sorted = [...entries].sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
  );
  const weights = sorted.map((entry) => Number(entry.weightKg));
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const weightRange = maxWeight - minWeight || 1;

  const points = sorted.map((entry, index) => {
    const x =
      sorted.length === 1
        ? CHART_WIDTH / 2
        : PADDING + (index / (sorted.length - 1)) * (CHART_WIDTH - PADDING * 2);
    const y =
      CHART_HEIGHT -
      PADDING -
      ((Number(entry.weightKg) - minWeight) / weightRange) * (CHART_HEIGHT - PADDING * 2);
    return { x, y, entry };
  });

  const polylinePoints = points.map((point) => `${point.x},${point.y}`).join(" ");
  const latest = sorted[sorted.length - 1]!;

  return (
    <div>
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        role="img"
        aria-label={`Weight chart, latest ${latest.weightKg} kg`}
        className="w-full"
      >
        {points.length > 1 ? (
          <polyline
            points={polylinePoints}
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}
        {points.map((point) => (
          <circle key={point.entry.id} cx={point.x} cy={point.y} r="4" fill="var(--color-primary)">
            <title>
              {point.entry.weightKg} kg on {new Date(point.entry.recordedAt).toLocaleDateString()}
            </title>
          </circle>
        ))}
      </svg>
      <p className="mt-2 text-sm text-black/60">
        Latest: {latest.weightKg} kg ({new Date(latest.recordedAt).toLocaleDateString()})
      </p>
    </div>
  );
}
