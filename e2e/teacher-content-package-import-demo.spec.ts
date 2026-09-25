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

test("teacher prepares a package and imports the downloaded example", async ({ page, context }, testInfo) => {
  test.setTimeout(120_000);
  const hostname = new URL(testInfo.project.use.baseURL ?? "").hostname;
  expect(["localhost", "127.0.0.1", "::1"], "E2E writes require a local test environment").toContain(hostname);

  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/login?next=%2Fteacher%2Fprograms");
  await page.getByLabel("Email", { exact: true }).fill(teacherEmail);
  await page.getByLabel("Пароль", { exact: true }).fill(teacherPassword);
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page).toHaveURL(/\/teacher\/programs$/);

  await page.getByRole("button", { name: "Создать программу" }).click();
  const createDialog = page.getByRole("dialog", { name: "Создать программу" });
  await createDialog.getByLabel("Предмет", { exact: true }).selectOption({ index: 1 });
  await createDialog.getByLabel("Название", { exact: true }).fill(`E2E подготовка ${Date.now()}`);
  await createDialog.getByRole("button", { name: "Создать", exact: true }).click();
  await page.getByRole("link", { name: /Открыть программу: E2E подготовка/ }).click();

  const modules = page.getByRole("region", { name: "Модули программы" });
  await modules.getByRole("button", { name: "Импортировать модули" }).click();
  const importer = page.getByRole("dialog", { name: "Импорт учебных модулей" });
  await expect(importer.getByText("Готового файла нет?")).toBeVisible();

  const templateDownloadPromise = page.waitForEvent("download");
  await importer.getByRole("link", { name: "Скачать шаблон YAML" }).click();
  const templateDownload = await templateDownloadPromise;
  expect(templateDownload.suggestedFilename()).toBe("tutor-content-package.yaml");
  const templatePath = await templateDownload.path();
  expect(templatePath).not.toBeNull();

  const exampleDownloadPromise = page.waitForEvent("download");
  await importer.getByRole("link", { name: "Скачать заполненный пример" }).click();
  const exampleDownload = await exampleDownloadPromise;
  expect(exampleDownload.suggestedFilename()).toBe("python-conditions.yaml");
  const examplePath = await exampleDownload.path();
  expect(examplePath).not.toBeNull();

  await importer.getByRole("button", { name: "Создать с помощью нейросети" }).click();
  const generator = page.getByRole("dialog", { name: "Подготовка учебных материалов с помощью ИИ" });
  await generator.getByLabel("Предмет").fill("Python");
  await generator.getByLabel("Название модуля").fill("Условные конструкции");
  await generator.getByRole("button", { name: "Скопировать промпт" }).click();
  await expect(generator.getByRole("status")).toContainText("Промпт скопирован");
  const prompt = await page.evaluate(() => navigator.clipboard.readText());
  expect(prompt).toContain("schemaVersion: 1\nkind: modules\nmodules:");
  expect(prompt).toContain("materialType: MARKDOWN");
  await generator.getByRole("button", { name: "Вернуться к импорту" }).click();

  await importer.getByLabel("Выберите YAML-файл").setInputFiles({
    name: templateDownload.suggestedFilename(),
    mimeType: "application/yaml",
    buffer: await import("node:fs/promises").then((fs) => fs.readFile(templatePath!)),
  });
  await importer.getByRole("button", { name: "Проверить файл" }).click();
  const preview = importer.getByRole("region", { name: "Предварительный просмотр модулей" });
  await expect(preview.getByText("Модулей: 1")).toBeVisible();
  await expect(preview.getByText("Тем: 1")).toBeVisible();
  await expect(preview.getByText("Материалов: 1")).toBeVisible();

  await importer.getByLabel("Заменить файл").setInputFiles({
    name: exampleDownload.suggestedFilename(),
    mimeType: "application/yaml",
    buffer: await import("node:fs/promises").then((fs) => fs.readFile(examplePath!)),
  });
  await importer.getByRole("button", { name: "Проверить файл" }).click();
  await expect(preview.getByText("Модулей: 1")).toBeVisible();
  await expect(preview.getByText("Тем: 2")).toBeVisible();
  await expect(preview.getByText("Материалов: 4")).toBeVisible();
  await expect(preview.getByRole("heading", { name: "Условные конструкции в Python" })).toBeVisible();

  await importer.getByRole("button", { name: "Импортировать 1 модулей" }).click();
  await expect(importer.getByRole("status")).toContainText("Создано модулей: 1, тем: 2, материалов: 4");
  await importer.getByRole("button", { name: "Вернуться к программе" }).click();
  const importedModule = modules.getByRole("heading", { name: "Условные конструкции в Python" });
  await expect(importedModule).toBeVisible();
  await importedModule.click();
  await modules.getByRole("link", { name: "Условие if" }).click();
  await expect(
    page.getByRole("region", { name: "Материалы" }).getByRole("heading", { name: "Теория: if" }),
  ).toBeVisible();
});
