import { test, expect } from "@playwright/test";
import { makeUniquePhone } from "./unique";

test("prescription view shows treatment lines and links from the patient timeline", async ({
  page,
  request,
}) => {
  const loginResponse = await request.post("http://localhost:3000/api/v1/auth/login", {
    data: { email: "dev@vetlog.local", password: "dev-password-change-me" },
  });
  const { accessToken } = await loginResponse.json();

  const uniquePhone = makeUniquePhone();
  const petName = `Prescription Test Pet ${uniquePhone}`;
  const ownerResponse = await request.post("http://localhost:3000/api/v1/owners", {
    headers: { Authorization: `Bearer ${accessToken}` },
    data: {
      name: "Prescription Test Owner",
      phone: uniquePhone,
      patient: { name: petName, species: "CAT" },
    },
  });
  const owner = await ownerResponse.json();
  const patientId = owner.patients[0].id;

  await request.post(`http://localhost:3000/api/v1/patients/${patientId}/cases`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    data: {
      type: "CONSULTATION",
      complaint: "Prescription e2e complaint",
      clinicalNotes: "Bland diet for 3 days.",
      treatments: [
        { drugName: "Metronidazole", dose: "50 mg", route: "PO", frequency: "BID", durationDays: 5 },
      ],
    },
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
  await page.getByRole("link", { name: "Prescription", exact: true }).click();

  await expect(page).toHaveURL(/\/cases\/.+\/prescription$/);
  await expect(page.getByText("Metronidazole")).toBeVisible();
  await expect(page.getByText(/50 mg/)).toBeVisible();
  await expect(page.getByText(/bland diet for 3 days/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /print.*save pdf/i })).toBeVisible();
});
