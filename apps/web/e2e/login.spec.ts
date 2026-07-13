import { test, expect } from "@playwright/test";

test("login lands on the Today page", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel(/email/i).fill("dev@vetlog.local");
  await page.getByLabel(/password/i).fill("dev-password-change-me");
  await page.getByRole("button", { name: /log in/i }).click();

  await expect(page).toHaveURL(/\/today$/);
  await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();
  await expect(page.getByRole("link", { name: /patients/i })).toBeVisible();
});
