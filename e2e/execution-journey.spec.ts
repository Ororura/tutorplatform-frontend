import { fillCodeEditor } from "./helpers/journeys";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { expect, test } from "@playwright/test";

import type { components } from "../src/shared/api/generated/schema";
import { login, uniqueName } from "./helpers/journeys";

const execute = promisify(execFile);

test("student runs wrong and correct code in Docker, then persists a standalone submission", async ({ page }) => {
  test.setTimeout(120_000);
  await login(page, "student");
  const programsResponse = await page.request.get("/api/v1/student/programs");
  expect(programsResponse.status()).toBe(200);
  const programs = await programsResponse.json();
  const program = programs.find((item: { title: string }) => item.title === "Python с нуля");
  expect(program).toBeTruthy();
  const detailResponse = await page.request.get(`/api/v1/student/programs/${program.id}`);
  expect(detailResponse.status()).toBe(200);
  const detail = await detailResponse.json();
  const topic = detail.modules
    .flatMap((item: { topics: { id: string; title: string }[] }) => item.topics)
    .find((item: { title: string }) => item.title === "Циклы for");
  const topicPath = `/student/programs/${program.id}/topics/${topic.id}`;
  await page.goto(topicPath);
  await expect(page.getByRole("heading", { name: "Циклы for", exact: true })).toBeVisible();
  const task = page
    .getByRole("listitem")
    .filter({ has: page.getByRole("heading", { name: "Выведи Hello, World!", exact: true }) });
  await task.getByRole("button", { name: "Решить", exact: true }).click();
  const taskResponse = await page.request.get(`/api/v1/student/programs/${program.id}/topics/${topic.id}/tasks`);
  expect(taskResponse.status()).toBe(200);
  const tasks = await taskResponse.json();
  const taskId = tasks.find((item: { title: string }) => item.title === "Выведи Hello, World!").id;
  const historyPath = `/api/v1/student/tasks/${taskId}/submissions?page=0&size=20`;
  const historyBefore = await page.request.get(historyPath);
  expect(historyBefore.status()).toBe(200);
  const totalBefore = (await historyBefore.json()).totalElements;
  const since = new Date().toISOString();
  const marker = uniqueName("wrong output");

  for (const [source, status] of [
    [`print(${JSON.stringify(marker)})`, "FAILED"],
    ['print("Hello, World!")', "PASSED"],
  ] as const) {
    await fillCodeEditor(page, source);
    const responsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        new URL(response.url()).pathname === `/api/v1/student/tasks/${taskId}/run`,
    );
    await page.getByRole("button", { name: "Запустить", exact: true }).click();
    const response = await responsePromise;
    expect(response.status()).toBe(200);
    const result = (await response.json()) as components["schemas"]["RunCodeResponse"];
    expect(result.executionId).toMatch(/^[0-9a-f-]{36}$/);
    expect(result.status).toBe(status);
    expect(result.totalTests).toBe(2);
    expect(result.passedTests).toBe(status === "PASSED" ? 2 : 0);
    expect(result.executionTimeMs).toBeGreaterThan(0);
    expect(result.tests).toHaveLength(2);
    for (const outcome of result.tests!) {
      expect(Object.keys(outcome).sort()).toEqual(["hidden", "passed", "position"]);
    }
    const run = page.getByRole("region", { name: "Результат запуска" });
    await expect(run).toContainText(status === "PASSED" ? "Все тесты пройдены" : "Есть непройденные тесты");
    await expect(run).toContainText(`Тесты: ${status === "PASSED" ? 2 : 0} из 2`);

    // Match the backend-issued execution ID to a real DockerSandboxRuntime log.
    // A fake frontend result or mocked worker cannot produce this evidence.
    await expect
      .poll(async () => {
        const { stdout } = await execute("docker", [
          "compose",
          "-f",
          ".github/e2e/compose.yml",
          "logs",
          "--no-color",
          "--since",
          since,
          "execution-worker",
        ]);
        return stdout.includes(`Sandbox execution completed: executionId=${result.executionId}`);
      })
      .toBe(true);
  }
  expect((await (await page.request.get(historyPath)).json()).totalElements).toBe(totalBefore);

  const submitted = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      new URL(response.url()).pathname === `/api/v1/student/tasks/${taskId}/code-submissions`,
  );
  await page.getByRole("button", { name: "Отправить решение", exact: true }).click();
  const response = await submitted;
  expect(response.status()).toBe(201);
  const submission = (await response.json()) as components["schemas"]["StudentSubmissionResponse"];
  expect(submission).toMatchObject({
    taskId,
    status: "PASSED",
    execution: { status: "PASSED", passedTests: 2, totalTests: 2 },
  });
  expect(submission.homeworkItemId).toBeNull();
  await expect(page.getByRole("region", { name: "Результат отправки" })).toContainText("Решение принято");
  await page.reload();
  await task.getByRole("button", { name: "Решить", exact: true }).click();
  await expect(page.getByText("Выполнено", { exact: true }).first()).toBeVisible();
  const persisted = await page.request.get(`/api/v1/student/submissions/${submission.id}`);
  expect(persisted.status()).toBe(200);
  expect(await persisted.json()).toMatchObject({
    id: submission.id,
    taskId,
    status: "PASSED",
    sourceCode: 'print("Hello, World!")',
    execution: { passedTests: 2, totalTests: 2 },
  });
  expect((await (await page.request.get(historyPath)).json()).totalElements).toBe(totalBefore + 1);
});
