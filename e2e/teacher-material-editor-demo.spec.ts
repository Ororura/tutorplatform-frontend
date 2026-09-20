import { expect, test, type Locator, type Page } from "@playwright/test";

const teacherEmail = "teacher.demo@tutor.local";
const teacherPassword = "DemoTeacher123!";
const existingTaskTitle = "Разница между = и ==";

function assertLocalTestEnvironment(page: Page) {
  const hostname = new URL(page.url()).hostname;
  expect(["localhost", "127.0.0.1", "::1"], "E2E mutations are allowed only on a local test environment").toContain(
    hostname,
  );
}

async function loginAsTeacher(page: Page) {
  await page.goto("/login?next=%2Fteacher%2Fstudents");
  assertLocalTestEnvironment(page);
  await page.getByLabel("Email", { exact: true }).fill(teacherEmail);
  await page.getByLabel("Пароль", { exact: true }).fill(teacherPassword);
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page).toHaveURL(/\/teacher\/students$/);
}

async function createProgram(page: Page, title: string) {
  await page.goto("/teacher/programs");
  await page.getByRole("button", { name: "Создать программу" }).click();

  const dialog = page.getByRole("dialog", { name: "Создать программу" });
  await dialog.getByLabel("Предмет", { exact: true }).selectOption({ label: "Python" });
  await dialog.getByLabel("Название", { exact: true }).fill(title);
  await dialog.getByLabel(/^Описание/).fill("Изолированная программа Playwright");
  await dialog.getByRole("button", { name: "Создать", exact: true }).click();

  const programLink = page.getByRole("link", { name: `Открыть программу: ${title}` });
  await expect(programLink).toBeVisible();
  await programLink.click();
  await expect(page).toHaveURL(/\/teacher\/programs\/[^/]+$/);
}

async function createModule(page: Page, title: string) {
  await page.getByRole("button", { name: "Добавить модуль" }).click();
  const dialog = page.getByRole("dialog", { name: "Добавить модуль" });
  await dialog.getByLabel("Название", { exact: true }).fill(title);
  await dialog.getByLabel("Описание", { exact: true }).fill("Модуль для проверки редактора материалов");
  await dialog.getByRole("button", { name: "Добавить", exact: true }).click();
  await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
}

async function createTopic(module: Locator, title: string) {
  const details = module.locator("details").first();

  if (!(await details.evaluate((element: HTMLDetailsElement) => element.open))) {
    await details.locator("summary").click();
  }

  const addTopicButton = module.getByRole("button", {
    name: "Добавить тему",
  });

  await expect(addTopicButton).toBeVisible();

  await addTopicButton.click();
  const dialog = module.page().getByRole("dialog", { name: "Добавить тему" });
  await dialog.getByLabel("Название", { exact: true }).fill(title);
  await dialog.getByLabel("Описание", { exact: true }).fill("Тема для проверки сохранения материалов");
  await dialog.getByRole("button", { name: "Добавить", exact: true }).click();
  await expect(module.getByRole("link", { name: title, exact: true })).toBeVisible();
}

async function createTextMaterialThroughApi(page: Page, topicId: string, title: string, content: string) {
  // TEXT is supported by the backend and editor, but the existing create dialog does not expose it.
  // Use the authenticated browser session so the test covers the real API without adding product functionality.
  const result = await page.evaluate(
    async ({ topicId: id, title: materialTitle, content: materialContent }) => {
      const csrfResponse = await fetch("/api/v1/auth/csrf", { credentials: "include" });
      const csrf = (await csrfResponse.json()) as { headerName: string; token: string };
      const response = await fetch(`/api/v1/teacher/topics/${encodeURIComponent(id)}/materials`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          [csrf.headerName]: csrf.token,
        },
        body: JSON.stringify({
          materialType: "TEXT",
          title: materialTitle,
          content: materialContent,
          externalUrl: null,
          position: 0,
        }),
      });

      return { status: response.status, body: await response.text() };
    },
    { topicId, title, content },
  );

  expect(result.status, result.body).toBe(201);
}

async function createMaterial(
  page: Page,
  material: { type: "MARKDOWN" | "CODE_EXAMPLE" | "LINK"; title: string; value: string },
) {
  await page.getByRole("button", { name: "Добавить материал" }).click();
  const dialog = page.getByRole("dialog", { name: "Добавить материал" });
  await dialog.getByLabel("Название", { exact: true }).fill(material.title);
  await dialog.getByLabel("Тип материала", { exact: true }).selectOption(material.type);

  if (material.type === "LINK") {
    await dialog.getByLabel("Ссылка", { exact: true }).fill(material.value);
  } else {
    const contentLabel = material.type === "MARKDOWN" ? "Содержимое Markdown" : "Содержимое кода";
    await dialog.getByLabel(contentLabel, { exact: true }).fill(material.value);
  }

  return dialog;
}

function materialItems(page: Page) {
  return page.getByRole("region", { name: "Материалы" }).locator(":scope > ol > li");
}

test("teacher creates and persists every editable material type", async ({ page }, testInfo) => {
  test.setTimeout(120_000);

  const suffix = `${Date.now()}-${testInfo.workerIndex}`;
  const programTitle = `E2E материалы ${suffix}`;
  const moduleTitle = `Модуль материалов ${suffix}`;
  const topicTitle = `Тема материалов ${suffix}`;
  const textTitle = `Текст ${suffix}`;
  const editedTextTitle = `Текст изменён ${suffix}`;
  const markdownTitle = `Markdown ${suffix}`;
  const codeTitle = `Код ${suffix}`;
  const linkTitle = `Ссылка ${suffix}`;
  const textContent = `Первая строка ${suffix}\nВторая строка`;
  const editedTextContent = `Обновлённый текст ${suffix}`;
  const markdownContent = `## Предпросмотр ${suffix}\n\n**Сохранённый Markdown**`;
  const codeContent = `const materialId = "${suffix}";\nconsole.log(materialId);`;
  const linkUrl = "https://example.com/material-editor";

  await loginAsTeacher(page);
  await createProgram(page, programTitle);
  await createModule(page, moduleTitle);

  const modules = page.getByRole("region", { name: "Модули программы" });
  const programModule = modules.locator(":scope > ol > li").filter({
    has: page.getByRole("heading", { name: moduleTitle, exact: true }),
  });
  await programModule.getByRole("heading", { name: moduleTitle, exact: true }).click();
  await createTopic(programModule, topicTitle);
  await programModule.getByRole("link", { name: topicTitle, exact: true }).click();
  await expect(page.getByRole("heading", { name: topicTitle, exact: true })).toBeVisible();

  const topicId = new URL(page.url()).pathname.match(/\/topics\/([^/]+)$/)?.[1];
  expect(topicId).toBeTruthy();
  await createTextMaterialThroughApi(page, topicId!, textTitle, textContent);
  await page.reload();
  await expect(page.getByRole("heading", { name: textTitle, exact: true })).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Материалы" }).getByRole("paragraph").filter({ hasText: textContent }),
  ).toBeVisible();

  const markdownDialog = await createMaterial(page, {
    type: "MARKDOWN",
    title: markdownTitle,
    value: markdownContent,
  });
  await markdownDialog.getByRole("tab", { name: "Предпросмотр" }).click();
  const preview = markdownDialog.getByRole("tabpanel");
  await expect(preview.getByRole("heading", { name: `Предпросмотр ${suffix}` })).toBeVisible();
  await expect(preview).toContainText("Сохранённый Markdown");
  await markdownDialog.getByRole("button", { name: "Добавить", exact: true }).click();
  await expect(page.getByRole("heading", { name: markdownTitle, exact: true })).toBeVisible();

  const codeDialog = await createMaterial(page, { type: "CODE_EXAMPLE", title: codeTitle, value: codeContent });
  await codeDialog.getByRole("button", { name: "Добавить", exact: true }).click();
  await expect(page.getByRole("heading", { name: codeTitle, exact: true })).toBeVisible();

  const linkDialog = await createMaterial(page, { type: "LINK", title: linkTitle, value: linkUrl });
  await linkDialog.getByRole("button", { name: "Добавить", exact: true }).click();
  const linkMaterial = materialItems(page).filter({ has: page.getByRole("heading", { name: linkTitle, exact: true }) });
  await expect(linkMaterial.getByRole("link", { name: "Открыть материал" })).toHaveAttribute("href", linkUrl);

  const textMaterial = materialItems(page).filter({
    has: page.getByRole("heading", { name: textTitle, exact: true }),
  });
  await textMaterial.getByRole("button", { name: "Редактировать" }).click();
  const editDialog = page.getByRole("dialog", { name: "Редактировать материал" });
  await editDialog.getByLabel("Название", { exact: true }).fill(editedTextTitle);
  await editDialog.getByLabel("Содержимое", { exact: true }).fill(editedTextContent);
  await editDialog.getByRole("button", { name: "Сохранить", exact: true }).click();
  await expect(page.getByRole("heading", { name: editedTextTitle, exact: true })).toBeVisible();
  const editedTextMaterial = materialItems(page).filter({
    has: page.getByRole("heading", { name: editedTextTitle, exact: true }),
  });
  await expect(editedTextMaterial.getByRole("paragraph").filter({ hasText: editedTextContent })).toBeVisible();

  await page.getByRole("button", { name: `Переместить «${editedTextTitle}» вниз` }).click();
  await expect(materialItems(page).locator(":scope > div:first-child > h3")).toHaveText([
    markdownTitle,
    editedTextTitle,
    codeTitle,
    linkTitle,
  ]);

  await page.getByRole("button", { name: "Прикрепить задание" }).click();
  const attachDialog = page.getByRole("dialog", { name: "Прикрепить задание" });
  await attachDialog.getByLabel("Поиск по названию").fill(existingTaskTitle);
  const task = attachDialog.getByRole("listitem").filter({ hasText: existingTaskTitle });
  await task.getByRole("button", { name: "Выбрать" }).click();
  await expect(page.getByRole("region", { name: "Практические задания" }).getByText(existingTaskTitle)).toBeVisible();

  await page.reload();

  await expect(page.getByRole("heading", { name: topicTitle, exact: true })).toBeVisible();
  await expect(materialItems(page).locator(":scope > div:first-child > h3")).toHaveText([
    markdownTitle,
    editedTextTitle,
    codeTitle,
    linkTitle,
  ]);
  await expect(
    materialItems(page)
      .filter({ has: page.getByRole("heading", { name: markdownTitle, exact: true }) })
      .getByRole("paragraph"),
  ).toContainText("Сохранённый Markdown");
  await expect(editedTextMaterial.getByRole("paragraph").filter({ hasText: editedTextContent })).toBeVisible();
  await expect(
    materialItems(page)
      .filter({ has: page.getByRole("heading", { name: codeTitle, exact: true }) })
      .getByRole("code"),
  ).toHaveText(codeContent);
  await expect(linkMaterial.getByRole("link", { name: "Открыть материал" })).toHaveAttribute("href", linkUrl);
  await expect(page.getByRole("region", { name: "Практические задания" }).getByText(existingTaskTitle)).toBeVisible();
});
