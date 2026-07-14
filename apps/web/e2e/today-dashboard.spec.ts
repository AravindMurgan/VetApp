import { test, expect } from "@playwright/test";
import { makeUniquePhone } from "./unique";

test("a logged case appears on the Today dashboard", async ({ page, request }) => {
  const loginResponse = await request.post("http://localhost:3000/api/v1/auth/login", {
    data: { email: "dev@vetlog.local", password: "dev-password-change-me" },
  });
  const { accessToken } = await loginResponse.json();

  const uniquePhone = makeUniquePhone();
  const petName = `Today Dashboard Pet ${uniquePhone}`;
  const complaint = `Itchy ears ${uniquePhone}`;
  await request.post("http://localhost:3000/api/v1/owners", {
    headers: { Authorization: `Bearer ${accessToken}` },
    data: {
      name: "Today Dashboard Owner",
      phone: uniquePhone,
      patient: { name: petName, species: "CAT" },
    },
  });

  await page.goto("/login");
  await page.getByLabel(/email/i).fill("dev@vetlog.local");
  await page.getByLabel(/password/i).fill("dev-password-change-me");
  await page.getByRole("button", { name: /log in/i }).click();
  await expect(page).toHaveURL(/\/today$/);

  // Sanity check: the pet isn't on Today before it has a case logged.
  await expect(page.getByText(petName)).toHaveCount(0);

  await page.getByRole("link", { name: /new case/i }).click();
  await page.getByLabel(/search patients/i).fill(uniquePhone);
  await page.getByRole("button").filter({ hasText: uniquePhone }).click();

  await page.getByRole("button", { name: "Consultation" }).click();
  await page.getByRole("button", { name: /^next$/i }).click();
  await page.getByLabel(/complaint/i).fill(complaint);
  await page.getByRole("button", { name: /^next$/i }).click();
  await page.getByRole("button", { name: /save case/i }).click();

  await expect(page).toHaveURL(/\/today$/, { timeout: 3000 });

  const caseCard = page.locator("li", { hasText: petName });
  await expect(caseCard).toBeVisible();
  await expect(caseCard).toContainText(complaint);
});
