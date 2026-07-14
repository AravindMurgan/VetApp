import { test, expect } from "@playwright/test";

test("marking a follow-up done removes it from Overdue", async ({ page, request }) => {
  const loginResponse = await request.post("http://localhost:3000/api/v1/auth/login", {
    data: { email: "dev@vetlog.local", password: "dev-password-change-me" },
  });
  const { accessToken } = await loginResponse.json();

  const uniquePhone = `555${Date.now().toString().slice(-7)}`;
  const petName = `Overdue Test Pet ${uniquePhone}`;
  const ownerResponse = await request.post("http://localhost:3000/api/v1/owners", {
    headers: { Authorization: `Bearer ${accessToken}` },
    data: {
      name: "Overdue Test Owner",
      phone: uniquePhone,
      patient: { name: petName, species: "DOG" },
    },
  });
  const owner = await ownerResponse.json();
  const patientId = owner.patients[0].id;

  const pastDueDate = new Date();
  pastDueDate.setDate(pastDueDate.getDate() - 5);

  await request.post(`http://localhost:3000/api/v1/patients/${patientId}/cases`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    data: {
      type: "CONSULTATION",
      followUp: {
        dueDate: pastDueDate.toISOString().slice(0, 10),
        reason: "RECHECK",
      },
    },
  });

  await page.goto("/login");
  await page.getByLabel(/email/i).fill("dev@vetlog.local");
  await page.getByLabel(/password/i).fill("dev-password-change-me");
  await page.getByRole("button", { name: /log in/i }).click();
  await expect(page).toHaveURL(/\/today$/);

  await page.getByRole("link", { name: /follow-ups/i }).click();
  await expect(page).toHaveURL(/\/follow-ups$/);

  const row = page.locator("li", { hasText: petName });
  await expect(row).toBeVisible();

  await row.getByRole("button", { name: /done/i }).click();

  await expect(page.locator("li", { hasText: petName })).toHaveCount(0);
  await expect(page.getByText(/marked .*done/i)).toBeVisible();

  // Reload to confirm the follow-up is really gone from Overdue, not just
  // optimistically hidden client-side.
  await page.reload();
  await expect(page.locator("li", { hasText: petName })).toHaveCount(0);
});
