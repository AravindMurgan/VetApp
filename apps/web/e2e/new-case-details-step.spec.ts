import { test, expect } from "@playwright/test";
import { makeUniquePhone } from "./unique";

// Regression test for a bug where clicking "Next" on the Details step (step 3)
// silently submitted the case instead of advancing to Treatments (step 4).
// Root cause: the Next (type="button") and Save case (type="submit") buttons
// rendered at the same JSX position with no `key`, so React patched the same
// DOM node's `type` attribute in place across the step transition. Because
// the state update flushed before the browser's native "is this a submit
// button" check for that same click, the click that looked like "Next" ended
// up submitting the form. Only reproduces in a real browser — RTL/jsdom's
// synthetic events didn't trigger it, hence a Playwright test, not just RTL.
test("clicking Next on the Details step advances to Treatments without saving the case", async ({
  page,
  request,
}) => {
  const loginResponse = await request.post("http://localhost:3000/api/v1/auth/login", {
    data: { email: "dev@vetlog.local", password: "dev-password-change-me" },
  });
  const { accessToken } = await loginResponse.json();

  const uniquePhone = makeUniquePhone();
  const petName = `Details Step Pet ${uniquePhone}`;
  await request.post("http://localhost:3000/api/v1/owners", {
    headers: { Authorization: `Bearer ${accessToken}` },
    data: {
      name: "Details Step Owner",
      phone: uniquePhone,
      patient: { name: petName, species: "DOG" },
    },
  });

  let caseCreateRequests = 0;
  page.on("request", (req) => {
    if (req.method() === "POST" && /\/patients\/.+\/cases$/.test(req.url())) {
      caseCreateRequests += 1;
    }
  });

  await page.goto("/login");
  await page.getByLabel(/email/i).fill("dev@vetlog.local");
  await page.getByLabel(/password/i).fill("dev-password-change-me");
  await page.getByRole("button", { name: /log in/i }).click();
  await expect(page).toHaveURL(/\/today$/);

  await page.getByRole("link", { name: /new case/i }).click();
  await page.getByLabel(/search patients/i).fill(uniquePhone);
  await page.getByRole("button").filter({ hasText: uniquePhone }).click();

  await page.getByRole("button", { name: "Consultation", exact: true }).click();
  await page.getByRole("button", { name: /^next$/i }).click();
  await expect(page.getByRole("heading", { name: "Details" })).toBeVisible();

  await page.getByLabel(/complaint/i).fill("Annual wellness check");
  await page.getByRole("button", { name: /^next$/i }).click();

  await expect(page.getByRole("heading", { name: "Treatments" })).toBeVisible();
  await expect(page).toHaveURL(/\/new-case$/);
  expect(caseCreateRequests).toBe(0);
});
