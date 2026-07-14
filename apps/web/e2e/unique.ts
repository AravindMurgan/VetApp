/**
 * Generates a value unique enough to avoid collisions across parallel
 * Playwright workers. `Date.now()` alone isn't sufficient — multiple workers
 * starting within the same millisecond can generate identical phone numbers
 * / emails, causing spurious 409s (or, worse, silent false-positive "existing
 * owner" matches) in tests that create fixtures via the API.
 */
function uniqueSuffix(): string {
  const time = Date.now().toString().slice(-7);
  const rand = Math.floor(Math.random() * 900 + 100); // always 3 digits
  return `${time}${rand}`;
}

export function makeUniquePhone(): string {
  return `555${uniqueSuffix()}`;
}

export function makeUniqueEmail(localPrefix: string): string {
  return `${localPrefix}-${uniqueSuffix()}@vetlog.local`;
}
