import { expect, test } from "@playwright/test";

const teacherEmail = "teacher.demo@tutor.local";
const teacherPassword = "DemoTeacher123!";

test("demo teacher previews and imports YAML modules into a new program", async ({ page }, testInfo) => {
  test.setTimeout(120_000);

  const hostname = new URL(testInfo.project.use.baseURL ?? "").hostname;
  expect(["localhost", "127.0.0.1", "::1"], "E2E writes require a local test environment").toContain(hostname);

  const suffix = `${Date.now()}-${testInfo.workerIndex}`;
  const programTitle = `E2E импорт ${suffix}`;
  const moduleTitle = `Основы импорта ${suffix}`;
  const editedModuleTitle = `Основы импорта обновлены ${suffix}`;
  const secondModuleTitle = `Практика импорта ${suffix}`;
  const topicTitle = `Введение ${suffix}`;
  const editedTopicTitle = `Введение обновлено ${suffix}`;
  const secondTopicTitle = `Упражнения ${suffix}`;
  const notesTitle = `Конспект ${suffix}`;
  const codeTitle = `Пример кода ${suffix}`;
  const linkTitle = `Справочник ${suffix}`;
  const yaml = `schemaVersion: 1
kind: modules
modules:
  - title: ${moduleTitle}
    topics:
      - title: ${topicTitle}
        materials:
          - title: ${notesTitle}
            materialType: MARKDOWN
            content: |
              # Импортированный конспект
              Проверка содержимого ${suffix}
          - title: ${codeTitle}
            materialType: CODE_EXAMPLE
            content: |
              print('imported')
  - title: ${secondModuleTitle}
    topics:
      - title: ${secondTopicTitle}
        materials:
          - title: ${linkTitle}
            materialType: LINK
            externalUrl: https://example.org/reference
`;

  await page.goto("/login?next=%2Fteacher%2Fprograms");
  await page.getByLabel("Email", { exact: true }).fill(teacherEmail);
  await page.getByLabel("Пароль", { exact: true }).fill(teacherPassword);
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page).toHaveURL(/\/teacher\/programs$/);

  await page.getByRole("button", { name: "Создать программу" }).click();
  const createDialog = page.getByRole("dialog", { name: "Создать программу" });
  await createDialog.getByLabel("Предмет", { exact: true }).selectOption({ index: 1 });
  await createDialog.getByLabel("Название", { exact: true }).fill(programTitle);
  await createDialog.getByLabel(/^Описание/).fill("Изолированная проверка импорта Playwright");
  await createDialog.getByRole("button", { name: "Создать", exact: true }).click();
  await page.getByRole("link", { name: `Открыть программу: ${programTitle}` }).click();
  await expect(page).toHaveURL(/\/teacher\/programs\/[^/]+$/);

  const modules = page.getByRole("region", { name: "Модули программы" });
  await expect(modules.getByRole("button", { name: "Добавить модуль" })).toBeVisible();
  await modules.getByRole("button", { name: "Импортировать модули" }).click();
  const importDialog = page.getByRole("dialog", { name: "Импорт учебных модулей" });
  await importDialog.getByLabel("Выберите YAML-файл").setInputFiles({
    name: "content-package.yaml",
    mimeType: "application/yaml",
    buffer: Buffer.from(yaml),
  });
  await importDialog.getByRole("button", { name: "Проверить файл" }).click();

  const preview = importDialog.getByRole("region", { name: "Предварительный просмотр модулей" });
  await expect(preview.getByText("Модулей: 2")).toBeVisible();
  await expect(preview.getByText("Тем: 2")).toBeVisible();
  await expect(preview.getByText("Материалов: 3")).toBeVisible();
  await expect(preview.getByRole("heading", { name: moduleTitle })).toBeVisible();
  await expect(preview.getByRole("heading", { name: topicTitle })).toBeVisible();
  await expect(preview.getByRole("heading", { name: secondModuleTitle })).toBeVisible();
  await expect(preview.getByRole("heading", { name: secondTopicTitle })).toBeVisible();

  await importDialog.getByRole("button", { name: "Импортировать 2 модулей" }).click();
  await expect(importDialog.getByRole("status")).toContainText("Создано модулей: 2, тем: 2, материалов: 3");
  await importDialog.getByRole("button", { name: "Вернуться к программе" }).click();

  const moduleItems = modules.locator(":scope > ol > li");
  await expect(moduleItems.locator(":scope > details > summary h3")).toHaveText([moduleTitle, secondModuleTitle]);
  const firstModule = moduleItems.first();
  await firstModule.getByRole("heading", { name: moduleTitle }).click();
  await firstModule.getByRole("button", { name: "Изменить", exact: true }).last().click();
  const editModuleDialog = page.getByRole("dialog", { name: "Изменить модуль" });
  await editModuleDialog.getByLabel("Название", { exact: true }).fill(editedModuleTitle);
  await editModuleDialog.getByRole("button", { name: "Сохранить" }).click();
  await expect(firstModule.getByRole("heading", { name: editedModuleTitle })).toBeVisible();

  await firstModule.getByRole("button", { name: "Изменить", exact: true }).first().click();
  const editTopicDialog = page.getByRole("dialog", { name: "Изменить тему" });
  await editTopicDialog.getByLabel("Название", { exact: true }).fill(editedTopicTitle);
  await editTopicDialog.getByRole("button", { name: "Сохранить" }).click();
  const topicLink = firstModule.getByRole("link", { name: editedTopicTitle });
  await expect(topicLink).toHaveAttribute("href", /\/teacher\/programs\/[^/]+\/topics\/[^/]+$/);
  await topicLink.click();
  await expect(page.getByRole("heading", { name: editedTopicTitle, exact: true })).toBeVisible();
  const materials = page.getByRole("region", { name: "Материалы" });
  await expect(materials.getByRole("heading", { name: notesTitle })).toBeVisible();
  await expect(materials.getByRole("paragraph").filter({ hasText: `Проверка содержимого ${suffix}` })).toBeVisible();
  await expect(materials.getByRole("heading", { name: codeTitle })).toBeVisible();
  await expect(materials.locator("pre").filter({ hasText: "print('imported')" })).toBeVisible();

  await page.goBack();
  const secondModule = moduleItems.nth(1);
  await secondModule.getByRole("heading", { name: secondModuleTitle }).click();
  await expect(secondModule.getByRole("link", { name: secondTopicTitle })).toBeVisible();
});
