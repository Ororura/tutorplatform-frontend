import { expect, test } from "@playwright/test";

test("demo teacher reads Task Library and atomically assigns TEXT + CODE homework", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill("teacher.demo@tutor.local");
  await page.getByLabel("Пароль", { exact: true }).fill("DemoTeacher123!");
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page).toHaveURL(/\/teacher\/students$/);

  await page.getByRole("link", { name: "Банк заданий" }).click();
  await expect(page.getByRole("heading", { name: "Банк заданий" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Когда использовать цикл while.*Текстовый ответ/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Сумма двух чисел.*Код/ })).toBeVisible();
  await page.getByRole("link", { name: /Сумма двух чисел/ }).click();
  await expect(page.getByRole("heading", { name: "Конфигурация кода" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Тесты" })).toBeVisible();
  await expect(page.getByText("Скрытый · NORMALIZED").first()).toBeVisible();

  await page.goto("/teacher/students");
  await page.getByLabel("Поиск ученика").fill("Алексей");
  await expect(page).toHaveURL(/search=/);
  await page.getByRole("link", { name: /Алексей Иванов/ }).click();
  await expect(page).toHaveURL(/\/teacher\/students\/[^/]+$/);
  await page.getByRole("link", { name: "Домашние задания", exact: true }).click();
  await expect(page.getByRole("link", { name: /Основы Python.*Выполнено/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Циклы.*Назначено/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Практика со списками.*Просрочено/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Повторение основ.*Отменено/ })).toBeVisible();
  await page.getByRole("link", { name: /Основы Python/ }).click();
  await expect(page.getByRole("heading", { name: "Задания" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Выведи Hello, World!" })).toBeVisible();

  await page.getByRole("link", { name: "Домашние задания" }).click();
  await page.getByRole("link", { name: "Назначить домашнее задание" }).first().click();
  await expect(page.getByLabel("Программа обучения")).toHaveValue(/.+/);
  const title = `E2E TEXT CODE ${Date.now()}`;
  await page.getByLabel("Название").fill(title);
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const pad = (value: number) => String(value).padStart(2, "0");
  const dueAt = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}T${pad(
    tomorrow.getHours(),
  )}:${pad(tomorrow.getMinutes())}`;
  await page.getByLabel("Срок").fill(dueAt);
  await page.getByRole("checkbox", { name: /Разница между = и ==/ }).check();
  await page.getByRole("checkbox", { name: /Сумма двух чисел/ }).check();
  const required = page.getByRole("checkbox", { name: "Обязательное" });
  await required.nth(1).uncheck();
  await page.getByRole("button", { name: "Назначить", exact: true }).click();
  await expect(page).toHaveURL(/\/teacher\/students\/[^/]+\/homework\/[^/]+$/);
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await expect(page.getByRole("link", { name: "Разница между = и ==" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Сумма двух чисел" })).toBeVisible();
  await expect(page.getByText("Необязательное")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
});
