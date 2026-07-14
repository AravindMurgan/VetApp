import { test, expect } from "@playwright/test";
import { makeUniquePhone } from "./unique";

test("patient profile shows the logged case in the timeline and lets you call the owner", async ({
  page,
  request,
}) => {
  const loginResponse = await request.post("http://localhost:3000/api/v1/auth/login", {
    data: { email: "dev@vetlog.local", password: "dev-password-change-me" },
  });
  const { accessToken } = await loginResponse.json();

  const uniquePhone = makeUniquePhone();
  const petName = `Profile Test Pet ${uniquePhone}`;
  const ownerResponse = await request.post("http://localhost:3000/api/v1/owners", {
    headers: { Authorization: `Bearer ${accessToken}` },
    data: {
      name: "Profile Test Owner",
      phone: uniquePhone,
      patient: { name: petName, species: "DOG" },
    },
  });
  const owner = await ownerResponse.json();
  const patientId = owner.patients[0].id;

  await request.post(`http://localhost:3000/api/v1/patients/${patientId}/cases`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    data: { type: "CONSULTATION", complaint: "Profile e2e complaint" },
  });

  await page.goto("/login");
  await page.getByLabel(/email/i).fill("dev@vetlog.local");
  await page.getByLabel(/password/i).fill("dev-password-change-me");
  await page.getByRole("button", { name: /log in/i }).click();
  await expect(page).toHaveURL(/\/today$/);

  await page.getByRole("link", { name: /patients/i }).click();
  await page.getByLabel(/search patients/i).fill(uniquePhone);
  await page.locator("a").filter({ hasText: uniquePhone }).click();

  await expect(page).toHaveURL(new RegExp(`/patients/${patientId}$`));
  await expect(page.getByRole("heading", { name: petName })).toBeVisible();
  await expect(page.getByText("Profile e2e complaint")).toBeVisible();

  const callLink = page.getByRole("link", { name: /call/i });
  await expect(callLink).toHaveAttribute("href", `tel:${uniquePhone}`);

  await page.getByRole("button", { name: "Weight" }).click();
  await expect(page.getByText(/no weight recorded yet/i)).toBeVisible();
});
