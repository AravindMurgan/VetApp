import { test, expect, type Locator } from "@playwright/test";

test("logs a vaccination case from a template in a small number of interactions", async ({
  page,
  request,
}) => {
  const loginResponse = await request.post("http://localhost:3000/api/v1/auth/login", {
    data: { email: "dev@vetlog.local", password: "dev-password-change-me" },
  });
  const { accessToken } = await loginResponse.json();

  const uniquePhone = `555${Date.now().toString().slice(-7)}`;
  const ownerResponse = await request.post("http://localhost:3000/api/v1/owners", {
    headers: { Authorization: `Bearer ${accessToken}` },
    data: {
      name: "New Case E2E Owner",
      phone: uniquePhone,
      patient: { name: "New Case E2E Pet", species: "DOG" },
    },
  });
  await ownerResponse.json();

  // Log in through the UI (not counted — the gate targets the case-logging
  // flow itself, per SPEC's "< 60s with a template" for New Case, not login).
  await page.goto("/login");
  await page.getByLabel(/email/i).fill("dev@vetlog.local");
  await page.getByLabel(/password/i).fill("dev-password-change-me");
  await page.getByRole("button", { name: /log in/i }).click();
  await expect(page).toHaveURL(/\/today$/);

  let interactions = 0;
  async function tap(locator: Locator) {
    await locator.click();
    interactions += 1;
  }
  async function fill(locator: Locator, value: string) {
    await locator.fill(value);
    interactions += 1;
  }

  await tap(page.getByRole("link", { name: /new case/i }));
  await expect(page).toHaveURL(/\/new-case$/);

  await fill(page.getByLabel(/search patients/i), uniquePhone);
  await tap(page.getByRole("button").filter({ hasText: uniquePhone }));

  await tap(page.getByRole("button", { name: "Vaccination", exact: true }));
  await tap(page.getByRole("button", { name: "Vaccination visit" }));

  await tap(page.getByRole("button", { name: /^next$/i })); // details step
  await tap(page.getByRole("button", { name: /^next$/i })); // treatments step

  await tap(page.getByRole("button", { name: /save case/i }));

  await expect(page.getByRole("status")).toHaveText("Case saved");
  await expect(page).toHaveURL(/\/today$/, { timeout: 3000 });

  expect(interactions).toBeLessThanOrEqual(8);
});
