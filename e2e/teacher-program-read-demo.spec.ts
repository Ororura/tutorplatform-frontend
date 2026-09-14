import { expect, test } from "@playwright/test";

test("demo teacher reads Alex, Maria and Ilya programs from the real backend", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill("teacher.demo@tutor.local");
  await page.getByLabel("Пароль", { exact: true }).fill("DemoTeacher123!");
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page).toHaveURL(/\/teacher\/students$/);

  await page.getByLabel("Поиск ученика").fill("Алексей");
  await expect(page).toHaveURL(/search=/);
  await page.getByRole("link", { name: /Алексей Иванов/ }).click();
  await expect(page.getByRole("heading", { name: "Алексей Иванов" })).toBeVisible();
  await page.getByRole("link", { name: "Программа", exact: true }).click();
  await expect(page).toHaveURL(/\/teacher\/students\/[^/]+\/programs\/[^/]+$/);
  await expect(page.getByRole("heading", { name: "Python с нуля" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Основы Python" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Управление программой" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Коллекции и функции" })).toBeVisible();
  await expect(page.getByText("Пройдена").first()).toBeVisible();
  await expect(page.getByText("В процессе").first()).toBeVisible();
  await expect(page.getByText("Доступна").first()).toBeVisible();
  await expect(page.getByText("Заблокирована").first()).toBeVisible();

  await page.getByRole("link", { name: /Переменные и типы данных/ }).click();
  await expect(page).toHaveURL(/\/topics\/[^/]+$/);
  await expect(page.getByRole("heading", { name: "Материалы" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Краткий конспект: переменные" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Переменные и типы данных" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Краткий конспект: переменные" })).toBeVisible();

  await page.goto("/teacher/students");
  await page.getByLabel("Поиск ученика").fill("Мария");
  await expect(page).toHaveURL(/search=/);
  await page.getByRole("link", { name: /Мария Петрова/ }).click();
  await expect(page.getByRole("heading", { name: "Мария Петрова" })).toBeVisible();
  await page.getByRole("link", { name: "Программа", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Python — начало обучения" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Первые шаги" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Знакомство с Python/ })).toBeVisible();

  await page.goto("/teacher/students");
  await page.getByLabel("Поиск ученика").fill("Илья");
  await expect(page).toHaveURL(/search=/);
  await page.getByRole("link", { name: /Илья Соколов/ }).click();
  await expect(page.getByRole("heading", { name: "Илья Соколов" })).toBeVisible();
  await page.getByRole("link", { name: "Программа", exact: true }).click();
  await expect(page.getByText("У ученика пока нет программы обучения")).toBeVisible();
});
