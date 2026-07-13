import { signAccessToken } from "../lib/jwt";

const TEST_USER_ID = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const TEST_USER_EMAIL = "route-test@vetlog.local";

/**
 * Signs a valid access token for route tests that need to pass `requireAuth`.
 * `requireAuth` only verifies the JWT — it never looks the user up in the
 * database — so no User row needs to exist for this to work.
 */
export function signTestAccessToken(): string {
  return signAccessToken({ sub: TEST_USER_ID, email: TEST_USER_EMAIL });
}
