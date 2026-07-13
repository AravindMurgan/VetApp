import { test, expect } from "@playwright/test";

test("create an owner+patient and find it via search", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill("dev@vetlog.local");
  await page.getByLabel(/password/i).fill("dev-password-change-me");
  await page.getByRole("button", { name: /log in/i }).click();
  await expect(page).toHaveURL(/\/today$/);

  await page.getByRole("link", { name: /patients/i }).click();
  await expect(page).toHaveURL(/\/patients$/);

  await page.getByRole("button", { name: /new patient/i }).click();

  const uniquePhone = `555${Date.now().toString().slice(-7)}`;
  const petName = `E2E Pet ${uniquePhone}`;

  await page.getByLabel(/owner phone/i).fill(uniquePhone);
  // Give the phone-lookup debounce time to resolve (no existing owner) before
  // filling the rest, so the "existing owner" path isn't accidentally taken.
  await page.waitForTimeout(500);

  await page.getByLabel(/owner name/i).fill("E2E Test Owner");
  await page.getByLabel(/pet name/i).fill(petName);
  await page.getByLabel(/species/i).selectOption("DOG");
  await page.getByRole("button", { name: /save patient/i }).click();

  await expect(page.getByRole("button", { name: /save patient/i })).toHaveCount(0);

  await page.getByLabel(/search patients/i).fill(uniquePhone);
  await expect(page.getByText(petName)).toBeVisible();
});
