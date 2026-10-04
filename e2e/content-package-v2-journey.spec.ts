import { expect, test } from "@playwright/test";

import type { components } from "../src/shared/api/generated/schema";
import { createProgram, importPackage, login, previewPackage, uniqueName } from "./helpers/journeys";

test("v2 YAML preview protects hidden tests and imports persisted TEXT/CODE content", async ({ page }) => {
  test.setTimeout(90_000);
  const title = uniqueName("content v2");
  const hiddenInput = "private-input-7391";
  const hiddenOutput = "private-output-8217";
  await login(page, "teacher");
  await createProgram(page, title);
  const programPath = new URL(page.url()).pathname;
  const { dialog, response } = await previewPackage(
    page,
    `schemaVersion: 2
kind: modules
modules:
  - title: Release v2 module
    topics:
      - title: Release v2 topic
        materials:
          - title: Release v2 material
            materialType: MARKDOWN
            content: Release v2 persisted lesson.
        tasks:
          - title: Release v2 TEXT
            descriptionMarkdown: Explain the difference between assignment and comparison.
            taskType: TEXT
            difficulty: MEDIUM
            required: true
          - title: Release v2 CODE
            descriptionMarkdown: Read and print the provided value.
            taskType: CODE
            difficulty: EASY
            required: false
            programmingConfig:
              language: PYTHON
              starterCode: "print(input())"
              executionEnabled: true
              timeLimitMs: 2000
              memoryLimitMb: 128
            testCases:
              - inputText: public-example
                expectedOutput: public-example
                hidden: false
                comparisonMode: NORMALIZED
              - inputText: ${hiddenInput}
                expectedOutput: ${hiddenOutput}
                hidden: true
                comparisonMode: NORMALIZED
`,
  );
  const preview = dialog.getByRole("region", { name: "Предварительный просмотр модулей" });
  for (const value of [
    "Модулей: 1",
    "Тем: 1",
    "Материалов: 1",
    "Заданий: 2",
    "Release v2 module",
    "Release v2 topic",
    "Release v2 material",
    "Release v2 TEXT",
    "Release v2 CODE",
    "Тестов: 2 · скрытых: 1",
    "Лимит времени: 2000 мс",
    "Лимит памяти: 128 МБ",
    "Выполнение кода: включено",
    "print(input())",
  ]) {
    await expect(preview).toContainText(value);
  }
  const projection = (await response.json()) as components["schemas"]["ContentPackagePreviewResponse"];
  expect(projection).toMatchObject({
    valid: true,
    schemaVersion: 2,
    moduleCount: 1,
    topicCount: 1,
    materialCount: 1,
    taskCount: 2,
  });
  const previewTasks = projection.modules![0].topics![0].tasks!;
  expect(previewTasks).toHaveLength(2);
  expect(previewTasks[1]).toMatchObject({
    taskType: "CODE",
    testCaseCount: 2,
    hiddenTestCaseCount: 1,
    programmingConfig: { language: "PYTHON", executionEnabled: true, timeLimitMs: 2000, memoryLimitMb: 128 },
  });
  for (const privateValue of [hiddenInput, hiddenOutput, '"inputText"', '"expectedOutput"', '"testCases"']) {
    expect(JSON.stringify(projection)).not.toContain(privateValue);
    await expect(preview).not.toContainText(privateValue);
  }
  await importPackage(dialog);
  await page.reload();
  await page.getByRole("heading", { name: "Release v2 module", exact: true }).click();
  const tasksPromise = page.waitForResponse(
    (response) =>
      response.request().method() === "GET" &&
      /\/api\/v1\/teacher\/topics\/[^/]+\/tasks$/.test(new URL(response.url()).pathname),
  );
  await page.getByRole("link", { name: "Release v2 topic", exact: true }).click();
  await expect(page.getByRole("region", { name: "Материалы" })).toContainText("Release v2 persisted lesson.");
  const taskList = page.getByRole("region", { name: "Практические задания" });
  await expect(taskList.getByText("Release v2 TEXT", { exact: true })).toBeVisible();
  await expect(taskList.getByText("Release v2 CODE", { exact: true })).toBeVisible();
  const tasksResponse = await tasksPromise;
  expect(tasksResponse.status()).toBe(200);
  const tasks = (await tasksResponse.json()) as components["schemas"]["TopicTaskDetailsResponse"][];
  expect(tasks.map((task) => task.title)).toEqual(["Release v2 TEXT", "Release v2 CODE"]);
  expect(tasks.map((task) => task.taskType)).toEqual(["TEXT", "CODE"]);
  await taskList
    .getByRole("listitem")
    .filter({ hasText: "Release v2 CODE" })
    .getByRole("link", { name: "Открыть задание" })
    .click();
  await expect(page.getByRole("heading", { name: "Конфигурация кода" })).toBeVisible();
  await expect(page.getByText("2000 мс", { exact: true })).toBeVisible();
  await expect(page.getByText("128 МБ", { exact: true })).toBeVisible();
  await expect(page.getByText("Открытый · NORMALIZED", { exact: true })).toBeVisible();
  await expect(page.getByText("Скрытый · NORMALIZED", { exact: true })).toBeVisible();
  const taskId = tasks[1].taskId;
  const codeResponse = await page.request.get(`/api/v1/teacher/tasks/${taskId}`);
  expect(codeResponse.status()).toBe(200);
  const code = await codeResponse.json();
  expect(code.programmingConfig).toMatchObject({
    language: "PYTHON",
    starterCode: "print(input())",
    executionEnabled: true,
    timeLimitMs: 2000,
    memoryLimitMb: 128,
  });
  expect(code.testCases).toHaveLength(2);
  expect(code.testCases.filter((item: { hidden: boolean }) => item.hidden)).toHaveLength(1);
  await page.goto(programPath);
  await page.getByRole("heading", { name: "Release v2 module", exact: true }).click();
  await expect(page.getByRole("link", { name: "Release v2 topic", exact: true })).toBeVisible();
});
