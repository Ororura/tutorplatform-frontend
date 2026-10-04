import { expect, test } from "@playwright/test";

import { login } from "./helpers/journeys";

// Authentication credentials and session cookies must not enter trace resources.
test.use({ trace: "off", screenshot: "off" });

test("teacher login survives reload and logout invalidates the server session", async ({ page }) => {
  await login(page, "teacher", "/teacher/students");
  await expect(page.getByRole("heading", { name: "Ученики", exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Ученики", exact: true })).toBeVisible();
  const me = await page.request.get("/api/v1/auth/me");
  expect(me.status()).toBe(200);
  expect(await me.json()).toMatchObject({ email: "teacher.demo@tutor.local", roles: ["TEACHER"] });
  await page.getByRole("button", { name: "Выйти", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect((await page.request.get("/api/v1/auth/me")).status()).toBe(401);
  await page.goto("/teacher/students");
  await expect(page).toHaveURL(/\/login\?next=%2Fteacher%2Fstudents$/);
});
