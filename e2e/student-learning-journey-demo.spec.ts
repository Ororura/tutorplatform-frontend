import { expect, test, type Page } from "@playwright/test";

const studentEmail = "alex.demo@tutor.local";
const studentPassword = "DemoStudent123!";

function assertLocalTestEnvironment(page: Page) {
  const hostname = new URL(page.url()).hostname;
  expect(["localhost", "127.0.0.1", "::1"], "E2E mutations are allowed only on a local test environment").toContain(
    hostname,
  );
}

test("demo student completes the learning journey", async ({ page }) => {
  test.setTimeout(120_000);

  await page.goto("/login?next=%2Fstudent");
  assertLocalTestEnvironment(page);
  await page.getByLabel("Email", { exact: true }).fill(studentEmail);
  await page.getByLabel("Пароль", { exact: true }).fill(studentPassword);
  await page.getByRole("button", { name: "Войти" }).click();

  await expect(page).toHaveURL(/\/student$/);
  await expect(page.getByRole("heading", { name: "Привет, Алексей Иванов!" })).toBeVisible();

  await page.getByRole("link", { name: "Мои программы", exact: true }).click();
  await expect(page).toHaveURL(/\/student\/programs$/);
  await expect(page.getByRole("heading", { name: "Назначенные программы" })).toBeVisible();

  const assignedProgram = page.getByRole("article").filter({
    has: page.getByRole("heading", { name: "Python с нуля", exact: true }),
  });
  await assignedProgram.getByRole("link", { name: "Открыть программу" }).click();
  await expect(page).toHaveURL(/\/student\/programs\/[^/]+$/);
  await expect(page.getByRole("heading", { name: "Python с нуля", exact: true })).toBeVisible();

  const programModule = page.getByRole("listitem").filter({
    has: page.getByRole("heading", { name: "Управление программой", exact: true }),
  });
  await expect(programModule).toBeVisible();
  await programModule.getByRole("link", { name: /Циклы for/ }).click();

  await expect(page).toHaveURL(/\/student\/programs\/[^/]+\/topics\/[^/]+$/);
  await expect(page.getByRole("heading", { name: "Циклы for", exact: true })).toBeVisible();

  const materials = page.getByRole("region", { name: "Учебные материалы" });
  await expect(materials.getByRole("heading", { name: "Основные правила работы с циклами" })).toBeVisible();
  await expect(materials).toContainText("Используйте for для обхода последовательностей");

  const codeTask = page.getByRole("listitem").filter({
    has: page.getByRole("heading", { name: "Выведи Hello, World!", exact: true }),
  });
  await expect(codeTask.getByText("Код", { exact: true })).toBeVisible();
  await codeTask.getByRole("button", { name: "Решить" }).click();

  await page.getByLabel("Код решения").fill('print("Hello, World!")');
  await page.getByRole("button", { name: "Отправить решение" }).click();

  const submissionResult = page.getByRole("region", { name: "Результат отправки" });
  await expect(submissionResult.getByText("Выполнено", { exact: true })).toBeVisible();
  await expect(submissionResult.getByText("Решение принято", { exact: true })).toBeVisible();
  await expect(submissionResult).toContainText("Тесты: 2 из 2");

  await page.getByRole("link", { name: "Домашние задания", exact: true }).click();
  await expect(page).toHaveURL(/\/student\/homework$/);
  await expect(page.getByRole("heading", { name: "Домашние задания", level: 1 })).toBeVisible();
});
