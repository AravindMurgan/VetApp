interface VitalsInput {
  temperatureC: string | null;
  heartRate: number | null;
  respRate: number | null;
  weightKg?: string | null;
}

/** Compact "38.5°C · HR 120 · RR 24 · 12.4 kg" line, omitting anything not recorded. */
export function formatVitals(vitals: VitalsInput): string | null {
  const parts: string[] = [];
  if (vitals.temperatureC != null) parts.push(`${Number(vitals.temperatureC)}°C`);
  if (vitals.heartRate != null) parts.push(`HR ${vitals.heartRate}`);
  if (vitals.respRate != null) parts.push(`RR ${vitals.respRate}`);
  if (vitals.weightKg != null) parts.push(`${Number(vitals.weightKg)} kg`);

  return parts.length > 0 ? parts.join(" · ") : null;
}
