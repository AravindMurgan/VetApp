import { test, expect } from "@playwright/test";

test("logging a vaccination auto-creates a VACCINE_DUE follow-up visible under Upcoming", async ({
  page,
  request,
}) => {
  const loginResponse = await request.post("http://localhost:3000/api/v1/auth/login", {
    data: { email: "dev@vetlog.local", password: "dev-password-change-me" },
  });
  const { accessToken } = await loginResponse.json();

  const uniquePhone = `555${Date.now().toString().slice(-7)}`;
  const petName = `Vaccination Test Pet ${uniquePhone}`;
  await request.post("http://localhost:3000/api/v1/owners", {
    headers: { Authorization: `Bearer ${accessToken}` },
    data: {
      name: "Vaccination Test Owner",
      phone: uniquePhone,
      patient: { name: petName, species: "DOG" },
    },
  });

  await page.goto("/login");
  await page.getByLabel(/email/i).fill("dev@vetlog.local");
  await page.getByLabel(/password/i).fill("dev-password-change-me");
  await page.getByRole("button", { name: /log in/i }).click();
  await expect(page).toHaveURL(/\/today$/);

  await page.getByRole("link", { name: /new case/i }).click();
  await page.getByLabel(/search patients/i).fill(uniquePhone);
  await page.getByRole("button").filter({ hasText: uniquePhone }).click();

  await page.getByRole("button", { name: "Vaccination", exact: true }).click();
  await page.getByRole("button", { name: "DHPPi" }).click();
  await page.getByRole("button", { name: "1st dose" }).click();

  await page.getByRole("button", { name: /^next$/i }).click();
  await page.getByRole("button", { name: /^next$/i }).click();
  await page.getByRole("button", { name: /save case/i }).click();

  await expect(page).toHaveURL(/\/today$/, { timeout: 3000 });

  // DHPPi's 1st -> 2nd dose gap is 4 weeks out, so the auto-created
  // FollowUp(VACCINE_DUE) lands in the Upcoming bucket, not Overdue/Today.
  await page.getByRole("link", { name: /follow-ups/i }).click();
  await page.getByRole("button", { name: "Upcoming" }).click();

  await expect(page.locator("li", { hasText: petName })).toBeVisible();
});
