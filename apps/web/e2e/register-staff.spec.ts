import { test, expect } from "@playwright/test";

test("an authenticated user can register a new staff account from More", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill("dev@vetlog.local");
  await page.getByLabel(/password/i).fill("dev-password-change-me");
  await page.getByRole("button", { name: /log in/i }).click();
  await expect(page).toHaveURL(/\/today$/);

  await page.getByRole("link", { name: /more/i }).click();
  await expect(page).toHaveURL(/\/more$/);

  await page.getByRole("button", { name: /add staff account/i }).click();

  const uniqueEmail = `staff-${Date.now()}@vetlog.local`;

  await page.getByLabel(/^email$/i).fill(uniqueEmail);
  await page.getByLabel(/^password$/i).fill("another-long-password");
  await page.getByLabel(/clinic name/i).fill("VetLog Clinic");
  await page.getByRole("button", { name: /create account/i }).click();

  await expect(page.getByRole("status")).toContainText(uniqueEmail);

  // Log out and confirm the newly-created account can log in on its own.
  await page.getByRole("button", { name: /log out/i }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.getByLabel(/email/i).fill(uniqueEmail);
  await page.getByLabel(/password/i).fill("another-long-password");
  await page.getByRole("button", { name: /log in/i }).click();

  await expect(page).toHaveURL(/\/today$/);
});
