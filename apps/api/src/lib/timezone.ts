function formatToPartsMap(timeZone: string, date: Date, options: Intl.DateTimeFormatOptions) {
  const dtf = new Intl.DateTimeFormat("en-US", { timeZone, ...options });
  const map: Record<string, string> = {};
  for (const part of dtf.formatToParts(date)) {
    if (part.type !== "literal") map[part.type] = part.value;
  }
  return map;
}

function getTimezoneOffsetMinutes(timeZone: string, date: Date): number {
  const map = formatToPartsMap(timeZone, date, {
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const asUtcMillis = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour),
    Number(map.minute),
    Number(map.second),
  );
  return (asUtcMillis - date.getTime()) / 60_000;
}

export function getLocalDateString(timeZone: string, date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/**
 * Computes the [start, end) UTC instant range for "today" as perceived in `timeZone`,
 * at the moment `now` occurs. Handles arbitrary IANA offsets (including DST) without
 * a date library, using only Intl.DateTimeFormat.
 */
export function getTodayRangeUtc(timeZone: string, now: Date = new Date()): { start: Date; end: Date } {
  const offsetMinutes = getTimezoneOffsetMinutes(timeZone, now);
  const parts = getLocalDateString(timeZone, now).split("-").map(Number);
  const [year, month, day] = parts as [number, number, number];
  const localMidnightUtcMillis = Date.UTC(year, month - 1, day, 0, 0, 0) - offsetMinutes * 60_000;
  const start = new Date(localMidnightUtcMillis);
  const end = new Date(localMidnightUtcMillis + 24 * 60 * 60 * 1000);
  return { start, end };
}
