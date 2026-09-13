import { expect, test } from "@playwright/test";

test("demo teacher completes the real students vertical slice", async ({ page }, testInfo) => {
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: "http://localhost:3000",
  });
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill("teacher.demo@tutor.local");
  await page.getByLabel("Пароль", { exact: true }).fill("DemoTeacher123!");
  await page.getByRole("button", { name: "Войти" }).click();

  await expect(page).toHaveURL(/\/teacher\/students$/);
  await expect(page.getByRole("link", { name: /Алексей Иванов/ })).toContainText("Зарегистрирован");
  await expect(page.getByRole("link", { name: /Мария Петрова/ })).toContainText("Зарегистрирован");
  await expect(page.getByRole("link", { name: /Илья Соколов/ })).toContainText(/Приглашён|Без аккаунта/);

  await page.getByLabel("Поиск ученика").fill("Алекс");
  await expect(page).toHaveURL(/search=%D0%90%D0%BB%D0%B5%D0%BA%D1%81/);
  await expect(page.getByRole("link", { name: /Алексей Иванов/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Мария Петрова/ })).toHaveCount(0);
  await page.getByRole("link", { name: /Алексей Иванов/ }).click();
  await expect(page.getByRole("heading", { name: "Алексей Иванов" })).toBeVisible();
  await expect(page.getByText("Зарегистрирован", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Отправить приглашение" })).toHaveCount(0);

  await page.getByRole("link", { name: "← Все ученики" }).click();
  await page.getByLabel("Поиск ученика").fill("Илья");
  await expect(page).toHaveURL(/search=%D0%98%D0%BB%D1%8C%D1%8F/);
  await page.getByRole("link", { name: /Илья Соколов/ }).click();
  await expect(page.getByRole("heading", { name: "Илья Соколов" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "История приглашений" })).toBeVisible();
  await expect(page.getByRole("listitem").getByText("ilya.demo@tutor.local")).toBeVisible();
  await expect(page.locator("body")).not.toContainText("tokenHash");

  const suffix = `${Date.now()}-${testInfo.workerIndex}`;
  await page.goto("/teacher/students");
  await page.getByRole("button", { name: "Добавить ученика" }).click();
  const createDialog = page.getByRole("dialog", { name: "Добавить ученика" });
  await createDialog.getByLabel("Имя", { exact: true }).fill("Тестовый");
  await createDialog.getByLabel("Фамилия", { exact: true }).fill(suffix);
  await createDialog.getByRole("button", { name: "Добавить ученика" }).click();
  await page.getByRole("link", { name: new RegExp(`Тестовый ${suffix}`) }).click();

  await page.getByRole("button", { name: "Отправить приглашение" }).click();
  const inviteDialog = page.getByRole("dialog", { name: "Отправить приглашение" });
  await inviteDialog.getByLabel("Email ученика").fill(`student-smoke-${suffix}@example.com`);
  await inviteDialog.getByRole("button", { name: "Создать приглашение" }).click();
  await expect(inviteDialog.getByLabel("Ссылка-приглашение")).toHaveValue(/\/invite\/student\//);
  await inviteDialog.getByRole("button", { name: "Копировать" }).click();
  await expect(inviteDialog.getByRole("button", { name: "Скопировано" })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", { name: new RegExp(`Тестовый ${suffix}`) })).toBeVisible();
  await expect(page.getByText("Приглашён", { exact: true })).toBeVisible();
});
