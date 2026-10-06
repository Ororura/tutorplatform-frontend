import { randomUUID } from "node:crypto";

import { expect, type Locator, type Page } from "@playwright/test";

export function uniqueName(label: string) {
  return `E2E ${label} ${randomUUID()}`;
}

export async function login(page: Page, role: "teacher" | "student", next = `/${role}`) {
  await page.goto(`/login?next=${encodeURIComponent(next)}`);
  await page
    .getByLabel("Email", { exact: true })
    .fill(role === "teacher" ? "teacher.demo@tutor.local" : "alex.demo@tutor.local");
  await page.getByLabel("Пароль", { exact: true }).fill(role === "teacher" ? "DemoTeacher123!" : "DemoStudent123!");
  await page.getByRole("button", { name: "Войти", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${next}$`));
}

export async function openAlex(page: Page) {
  await page.goto("/teacher/students");
  await page.getByLabel("Поиск ученика").fill("Алексей");
  await page.getByRole("link", { name: /Алексей Иванов/ }).click();
  await expect(page.getByRole("heading", { name: "Алексей Иванов" })).toBeVisible();
  return new URL(page.url()).pathname.split("/")[3];
}

export async function createProgram(page: Page, title: string) {
  await page.goto("/teacher/programs");
  await page.getByRole("button", { name: "Создать программу", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Создать программу", exact: true });
  await dialog.getByLabel("Предмет", { exact: true }).selectOption({ label: "Python" });
  await dialog.getByLabel("Название", { exact: true }).fill(title);
  await dialog.getByRole("button", { name: "Создать", exact: true }).click();
  await page.getByRole("link", { name: `Открыть программу: ${title}`, exact: true }).click();
  await expect(page).toHaveURL(/\/teacher\/programs\/[^/]+$/);
  await expect(page.getByRole("heading", { name: title, level: 1, exact: true })).toBeVisible();
}

export async function previewPackage(page: Page, yaml: string) {
  await page.getByRole("button", { name: "Импортировать модули" }).click();
  const dialog = page.getByRole("dialog", { name: "Импорт учебных модулей" });
  await dialog
    .getByLabel("Выберите YAML-файл")
    .setInputFiles({ name: "release.yaml", mimeType: "application/yaml", buffer: Buffer.from(yaml) });
  const response = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" && new URL(response.url()).pathname.endsWith("/imports/preview"),
  );
  await dialog.getByRole("button", { name: "Проверить файл" }).click();
  expect((await response).status()).toBe(200);
  await expect(dialog.getByRole("region", { name: "Предварительный просмотр модулей" })).toBeVisible();
  return { dialog, response: await response };
}

export async function importPackage(dialog: Locator) {
  await dialog.getByRole("button", { name: /^Импортировать \d+ модулей$/ }).click();
  await expect(dialog.getByRole("status")).toContainText("Создано модулей:");
  await dialog.getByRole("button", { name: "Вернуться к программе" }).click();
  await expect(dialog).toBeHidden();
}

export async function activateProgram(page: Page) {
  const modules = page.getByRole("region", { name: "Модули программы" });
  await modules.getByRole("button", { name: "Выбрать темы", exact: true }).click();
  const selection = modules.getByRole("region", { name: "Выбор тем" });
  await selection.getByRole("button", { name: "Выбрать все", exact: true }).click();
  await selection.getByRole("button", { name: "Активировать", exact: true }).click();
  await expect(selection).toBeHidden();
  await page.getByRole("button", { name: "Активировать", exact: true }).click();
  await expect(page.getByRole("button", { name: "Создать копию", exact: true })).toBeVisible();
}

export async function assignProgramToAlex(page: Page, title: string) {
  const studentId = await openAlex(page);
  await page.getByRole("link", { name: "Программа", exact: true }).click();
  await page.getByRole("button", { name: /^Назначить (ещё )?программу$/ }).click();
  const dialog = page.getByRole("dialog", { name: "Назначить программу" });
  await dialog.getByRole("radio", { name: title }).check();
  await dialog.getByRole("button", { name: "Назначить", exact: true }).click();
  await expect(page).toHaveURL(/\/teacher\/students\/[^/]+\/programs\/[^/]+$/);
  await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
  return { studentId, studentProgramId: new URL(page.url()).pathname.split("/")[5] };
}

export async function expectMobileLayout(page: Page, action: Locator) {
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth))
    .toBeLessThanOrEqual(1);
  await action.scrollIntoViewIfNeeded();
  await expect(action).toBeVisible();
  await expect
    .poll(
      () =>
        action.evaluate((element) => {
          const rect = element.getBoundingClientRect();
          const top = Math.max(rect.top, 0);
          const bottom = Math.min(rect.bottom, window.innerHeight);
          const hit = document.elementFromPoint(rect.left + rect.width / 2, top + (bottom - top) / 2);
          return bottom > top && (hit === element || element.contains(hit));
        }),
      { message: "Primary action must not be covered by fixed/sticky content" },
    )
    .toBe(true);
}

export async function fillCodeEditor(page: Page, source: string) {
  await expect(page.locator(".monaco-editor .view-lines")).toBeVisible();
  await page.locator(".monaco-editor .view-lines").click();
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.insertText(source);
}
