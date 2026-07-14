const VISIT_COUNT_KEY = "vetlog:visitCount";
const SESSION_COUNTED_KEY = "vetlog:visitCountedThisSession";

/**
 * Counts one visit per browser tab session (guarded via sessionStorage so
 * re-renders/remounts within the same session don't inflate the count), and
 * returns the running total across all sessions.
 */
export function recordVisit(): number {
  const alreadyCounted = window.sessionStorage.getItem(SESSION_COUNTED_KEY);
  const current = Number(window.localStorage.getItem(VISIT_COUNT_KEY) ?? "0");

  if (alreadyCounted) {
    return current;
  }

  const next = current + 1;
  window.localStorage.setItem(VISIT_COUNT_KEY, String(next));
  window.sessionStorage.setItem(SESSION_COUNTED_KEY, "1");
  return next;
}
