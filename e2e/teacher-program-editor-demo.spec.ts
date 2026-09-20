import { expect, test, type Locator, type Page } from "@playwright/test";

const teacherEmail = "teacher.demo@tutor.local";
const teacherPassword = "DemoTeacher123!";

async function createModule(page: Page, title: string, description: string) {
  await page.getByRole("button", { name: "Добавить модуль" }).click();
  const dialog = page.getByRole("dialog", { name: "Добавить модуль" });
  await dialog.getByLabel("Название", { exact: true }).fill(title);
  await dialog.getByLabel("Описание", { exact: true }).fill(description);
  await dialog.getByRole("button", { name: "Добавить", exact: true }).click();
  await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
}

async function createTopic(module: Locator, title: string, description: string) {
  await module.getByRole("button", { name: "Добавить тему" }).click();
  const dialog = module.page().getByRole("dialog", { name: "Добавить тему" });
  await dialog.getByLabel("Название", { exact: true }).fill(title);
  await dialog.getByLabel("Описание", { exact: true }).fill(description);
  await dialog.getByRole("button", { name: "Добавить", exact: true }).click();
  await expect(module.getByText(title, { exact: true })).toBeVisible();
}

test("demo teacher creates, edits, reorders, activates and archives a program", async ({ page }, testInfo) => {
  test.setTimeout(120_000);

  const suffix = `${Date.now()}-${testInfo.workerIndex}`;
  const initialTitle = `E2E программа ${suffix}`;
  const programTitle = `E2E редактор ${suffix}`;
  const programDescription = `Описание программы ${suffix}`;
  const firstModuleTitle = `Основы ${suffix}`;
  const secondModuleTitle = `Практика ${suffix}`;
  const firstTopicTitle = `Первая тема ${suffix}`;
  const secondTopicTitle = `Вторая тема ${suffix}`;

  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(teacherEmail);
  await page.getByLabel("Пароль", { exact: true }).fill(teacherPassword);
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page).toHaveURL(/\/teacher\/students$/);

  await page.goto("/teacher/programs");
  await page.getByRole("button", { name: "Создать программу" }).click();
  const createProgramDialog = page.getByRole("dialog", { name: "Создать программу" });
  await createProgramDialog.getByLabel("Предмет", { exact: true }).selectOption({ index: 1 });
  await createProgramDialog.getByLabel("Название", { exact: true }).fill(initialTitle);
  await createProgramDialog.getByLabel("Описание", { exact: true }).fill("Исходное описание");
  await createProgramDialog.getByRole("button", { name: "Создать", exact: true }).click();

  const programLink = page.getByRole("link", { name: `Открыть программу: ${initialTitle}` });
  await expect(programLink).toBeVisible();
  await programLink.click();
  await expect(page).toHaveURL(/\/teacher\/programs\/[^/]+$/);

  await page.getByRole("button", { name: "Редактировать" }).click();
  const editProgramDialog = page.getByRole("dialog", { name: "Редактировать программу" });
  await editProgramDialog.getByLabel("Название", { exact: true }).fill(programTitle);
  await editProgramDialog.getByLabel("Описание", { exact: true }).fill(programDescription);
  await editProgramDialog.getByRole("button", { name: "Сохранить" }).click();
  await expect(page.getByRole("heading", { name: programTitle, exact: true })).toBeVisible();
  await expect(page.getByText(programDescription, { exact: true })).toBeVisible();

  await createModule(page, firstModuleTitle, "Первый модуль");
  await createModule(page, secondModuleTitle, "Второй модуль");

  const modulesSection = page.getByRole("region", { name: "Модули программы" });
  const moduleItems = modulesSection.locator(":scope > ol > li");
  const firstModule = moduleItems.filter({
    has: page.getByRole("heading", { name: firstModuleTitle, exact: true }),
  });

  await firstModule.getByRole("heading", { name: firstModuleTitle, exact: true }).click();
  await createTopic(firstModule, firstTopicTitle, "Описание первой темы");
  await createTopic(firstModule, secondTopicTitle, "Описание второй темы");

  const firstTopic = firstModule.locator("ol > li").filter({ hasText: firstTopicTitle });
  await firstTopic.getByRole("button", { name: "Изменить" }).click();
  const editTopicDialog = page.getByRole("dialog", { name: "Изменить тему" });
  await editTopicDialog.getByLabel("Статус", { exact: true }).selectOption("ACTIVE");
  await editTopicDialog.getByRole("button", { name: "Сохранить" }).click();
  await expect(firstTopic.getByText("Активна", { exact: true })).toBeVisible();

  await firstModule.getByRole("button", { name: "Переместить модуль вниз" }).click();
  await expect(moduleItems.locator(":scope > details > summary h3")).toHaveText([secondModuleTitle, firstModuleTitle]);

  await firstTopic.getByRole("button", { name: "Переместить тему вниз" }).click();
  const topicItems = firstModule.locator("ol > li");
  await expect(topicItems.nth(0)).toContainText(secondTopicTitle);
  await expect(topicItems.nth(1)).toContainText(firstTopicTitle);

  await page.reload();
  await expect(page.getByRole("heading", { name: programTitle, exact: true })).toBeVisible();
  await expect(page.getByText(programDescription, { exact: true })).toBeVisible();
  await expect(moduleItems.locator(":scope > details > summary h3")).toHaveText([secondModuleTitle, firstModuleTitle]);

  await firstModule.getByRole("heading", { name: firstModuleTitle, exact: true }).click();
  await expect(topicItems.nth(0)).toContainText(secondTopicTitle);
  await expect(topicItems.nth(1)).toContainText(firstTopicTitle);
  await expect(topicItems.nth(1).getByText("Активна", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Активировать" }).click();
  await expect(page.getByText("Активна", { exact: true }).first()).toBeVisible();

  await page.getByRole("button", { name: "Архивировать" }).click();
  const archiveDialog = page.getByRole("dialog", { name: "Архивировать программу?" });
  await archiveDialog.getByRole("button", { name: "Архивировать" }).click();
  await expect(page.getByText("В архиве", { exact: true }).first()).toBeVisible();

  await expect(page.getByRole("button", { name: "Редактировать" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Добавить модуль" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Добавить тему" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Изменить" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Переместить (модуль|тему)/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Активировать" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Архивировать" })).toHaveCount(0);
});
