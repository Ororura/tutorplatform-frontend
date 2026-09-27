import { expect, test, type Locator, type Page } from "@playwright/test";

async function expandModule(module: Locator) {
  const details = module.locator(":scope > details");
  await expect(details).toBeVisible();
  if (!(await details.evaluate((element: HTMLDetailsElement) => element.open))) {
    await details.locator(":scope > summary").click();
  }
}

async function openIlyaPrograms(page: Page) {
  await page.goto("/teacher/students");
  await page.getByLabel("Поиск ученика").fill("Илья");
  await page.getByRole("link", { name: /Илья Соколов/ }).click();
  await page.getByRole("link", { name: "Программа", exact: true }).click();
  await expect(page.getByRole("button", { name: /^Назначить (ещё )?программу$/ })).toBeVisible();
}

// Assigned ACTIVE source is immutable; its independent DRAFT copy is editable.
// Evolving the copy must preserve both the source structure and its student assignment.
test("teacher evolves an assigned program through an independent draft copy", async ({ page }, testInfo) => {
  test.setTimeout(150_000);
  const suffix = `${Date.now()}-${testInfo.workerIndex}`;
  const sourceTitle = `M14 evolution ${suffix}`;
  const sourceDescription = `Исходное описание программы ${suffix}`;
  const moduleTitle = `Исходный модуль ${suffix}`;
  const topicTitle = `Исходная тема ${suffix}`;
  const topicDescription = `Исходное описание темы ${suffix}`;
  const copyTitle = `${sourceTitle} — копия`;
  const evolvedTitle = `M14 evolved ${suffix}`;
  const evolvedDescription = `Новая версия программы ${suffix}`;
  const evolvedTopicTitle = `Новая тема ${suffix}`;

  await page.goto("/login?next=%2Fteacher%2Fstudents");
  const hostname = new URL(page.url()).hostname.replace(/^\[|\]$/g, "");
  expect(["localhost", "127.0.0.1", "::1"], "E2E mutations are allowed only on a local test environment").toContain(
    hostname,
  );
  await page.getByLabel("Email", { exact: true }).fill("teacher.demo@tutor.local");
  await page.getByLabel("Пароль", { exact: true }).fill("DemoTeacher123!");
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page).toHaveURL(/\/teacher\/students$/);

  await page.goto("/teacher/programs");
  await page.getByRole("button", { name: "Создать программу" }).click();
  const createDialog = page.getByRole("dialog", { name: "Создать программу" });
  await createDialog.getByLabel("Предмет", { exact: true }).selectOption({ label: "Python" });
  await createDialog.getByLabel("Название", { exact: true }).fill(sourceTitle);
  await createDialog.getByLabel(/^Описание/).fill(sourceDescription);
  await createDialog.getByRole("button", { name: "Создать", exact: true }).click();
  await page.getByRole("link", { name: `Открыть программу: ${sourceTitle}`, exact: true }).click();
  await expect(page).toHaveURL(/\/teacher\/programs\/[^/]+$/);
  const sourceUrl = page.url();

  await page.getByRole("button", { name: "Добавить модуль" }).click();
  const moduleDialog = page.getByRole("dialog", { name: "Добавить модуль" });
  await moduleDialog.getByLabel("Название", { exact: true }).fill(moduleTitle);
  await moduleDialog.getByRole("button", { name: "Добавить", exact: true }).click();
  const programModule = page
    .getByRole("region", { name: "Модули программы" })
    .locator(":scope > ol > li")
    .filter({
      has: page.getByRole("heading", { name: moduleTitle, exact: true }),
    });
  await expandModule(programModule);
  await programModule.getByRole("button", { name: "Добавить тему" }).click();
  const topicDialog = page.getByRole("dialog", { name: "Добавить тему" });
  await topicDialog.getByLabel("Название", { exact: true }).fill(topicTitle);
  await topicDialog.getByLabel("Описание", { exact: true }).fill(topicDescription);
  await topicDialog.getByRole("button", { name: "Добавить", exact: true }).click();
  const sourceTopic = programModule.locator("ol > li").filter({
    has: page.getByRole("link", { name: topicTitle, exact: true }),
  });
  await sourceTopic.getByRole("button", { name: `Действия темы «${topicTitle}»` }).click();
  await sourceTopic.getByRole("menuitem", { name: "Редактировать" }).click();
  const editTopicDialog = page.getByRole("dialog", { name: "Изменить тему" });
  await editTopicDialog.getByRole("combobox", { name: /^Статус/ }).selectOption("ACTIVE");
  await editTopicDialog.getByRole("button", { name: "Сохранить" }).click();
  await expect(sourceTopic.locator("span").filter({ hasText: /^Активна$/ })).toBeVisible();
  await page.getByRole("button", { name: "Активировать", exact: true }).click();
  const programHeader = page.locator("section").filter({
    has: page.getByRole("heading", { level: 1 }),
  });
  await expect(programHeader.getByText("Активна", { exact: true })).toBeVisible();

  await openIlyaPrograms(page);
  await page.getByRole("button", { name: /^Назначить (ещё )?программу$/ }).click();
  const assignmentDialog = page.getByRole("dialog", { name: "Назначить программу" });
  await assignmentDialog.getByRole("radio", { name: sourceTitle }).check();
  await assignmentDialog.getByRole("button", { name: "Назначить", exact: true }).click();
  await expect(page).toHaveURL(/\/teacher\/students\/[^/]+\/programs\/[^/]+$/);
  await expect(page.getByRole("heading", { name: sourceTitle, exact: true })).toBeVisible();
  const assignmentUrl = page.url();

  await page.goto(sourceUrl);
  await expect(page.getByRole("heading", { name: sourceTitle, exact: true })).toBeVisible();
  await expect(programHeader.getByText("Активна", { exact: true })).toBeVisible();
  await expandModule(programModule);
  await expect(page.getByRole("button", { name: "Редактировать", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^Добавить (модуль|тему)$/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^Действия (модуля|темы)/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Создать копию", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Создать копию", exact: true }).click();
  const duplicateDialog = page.getByRole("dialog", { name: "Создать копию программы?", exact: true });
  await expect(duplicateDialog).toBeVisible();
  await duplicateDialog.getByRole("button", { name: "Создать копию", exact: true }).click();
  await expect(page).not.toHaveURL(sourceUrl);
  await expect(page).toHaveURL(/\/teacher\/programs\/[^/]+$/);
  await expect(page.getByRole("heading", { name: copyTitle, exact: true })).toBeVisible();
  await expect(programHeader.getByText("Черновик", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Редактировать", exact: true })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Добавить модуль" })).toBeEnabled();
  await expandModule(programModule);
  await expect(sourceTopic.getByRole("link", { name: topicTitle, exact: true })).toBeVisible();
  await expect(sourceTopic.getByRole("paragraph").filter({ hasText: topicDescription })).toBeVisible();

  await page.getByRole("button", { name: "Редактировать", exact: true }).click();
  const editProgramDialog = page.getByRole("dialog", { name: "Редактировать программу" });
  await editProgramDialog.getByLabel("Название", { exact: true }).fill(evolvedTitle);
  await editProgramDialog.getByLabel(/^Описание/).fill(evolvedDescription);
  await editProgramDialog.getByRole("button", { name: "Сохранить" }).click();
  await expect(page.getByRole("heading", { name: evolvedTitle, exact: true })).toBeVisible();
  await sourceTopic.getByRole("button", { name: `Действия темы «${topicTitle}»` }).click();
  await sourceTopic.getByRole("menuitem", { name: "Редактировать" }).click();
  await editTopicDialog.getByLabel("Название", { exact: true }).fill(evolvedTopicTitle);
  await editTopicDialog.getByRole("button", { name: "Сохранить" }).click();
  await expect(programModule.getByRole("link", { name: evolvedTopicTitle, exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: evolvedTitle, exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "Описание", exact: true })).toContainText(evolvedDescription);
  await expect(programHeader.getByText("Черновик", { exact: true })).toBeVisible();
  await expandModule(programModule);
  await expect(programModule.getByRole("link", { name: evolvedTopicTitle, exact: true })).toBeVisible();

  await page.goto(sourceUrl);
  await expect(page.getByRole("heading", { name: sourceTitle, exact: true })).toBeVisible();
  await expect(programHeader.getByText("Активна", { exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "Описание", exact: true })).toContainText(sourceDescription);
  await expandModule(programModule);
  await expect(sourceTopic.getByRole("link", { name: topicTitle, exact: true })).toBeVisible();
  await expect(sourceTopic.getByRole("paragraph").filter({ hasText: topicDescription })).toBeVisible();
  for (const changedText of [evolvedTitle, evolvedDescription, evolvedTopicTitle]) {
    await expect(page.locator("body")).not.toContainText(changedText);
  }

  await openIlyaPrograms(page);
  const assignedSource = page.getByRole("link").filter({ has: page.getByText(sourceTitle, { exact: true }) });
  await expect(assignedSource).toBeVisible();
  await expect(page.locator("body")).not.toContainText(copyTitle);
  await expect(page.locator("body")).not.toContainText(evolvedTitle);
  await assignedSource.click();
  await expect(page).toHaveURL(assignmentUrl);
  await expect(page.getByRole("heading", { name: sourceTitle, exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: moduleTitle, exact: true })).toBeVisible();
  await expect(page.getByRole("link").filter({ has: page.getByText(topicTitle, { exact: true }) })).toBeVisible();
  await expect(page.locator("body")).not.toContainText(evolvedTopicTitle);
});
