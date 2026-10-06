import { fillCodeEditor } from "./helpers/journeys";
import { expect, test, type Page } from "@playwright/test";

import type { StudentHomeworkDetails, StudentHomeworkPage } from "../src/entities/homework";
import type { StudentSubmissionPage } from "../src/entities/submission";

const widths = [1536, 1440, 1280, 1024, 768, 390];

async function login(page: Page) {
  await page.goto("/login?next=%2Fstudent");
  await page.getByLabel("Email", { exact: true }).fill("alex.demo@tutor.local");
  await page.getByLabel("Пароль", { exact: true }).fill("DemoStudent123!");
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page.getByRole("heading", { name: "Добрый день, Алексей!" })).toBeVisible();
}

async function getHomework(page: Page, status: "COMPLETED" | "ASSIGNED") {
  const response = await page.request.get(`/api/v1/student/homeworks?status=${status}&size=20&sort=assignedAt,desc`);
  expect(response.ok()).toBe(true);
  const list: StudentHomeworkPage = await response.json();
  expect(list.items.length).toBeGreaterThan(0);
  const details: StudentHomeworkDetails[] = [];
  for (const item of list.items) {
    const detail = await page.request.get(`/api/v1/student/homeworks/${item.id}`);
    expect(detail.ok()).toBe(true);
    details.push(await detail.json());
    if (status === "ASSIGNED") break;
  }
  return (
    details.find((detail) =>
      detail.items.some((item) => !item.required && item.latestSubmissionStatus === "NEEDS_REVIEW"),
    ) ?? details[0]
  );
}

async function screenshot(page: Page, name: string) {
  const path = test.info().outputPath(`${name}.png`);
  await page.screenshot({ path, fullPage: true });
  await test.info().attach(name, { path, contentType: "image/png" });
}

async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(await page.locator("main a a, main a button, main button a, main button button").count()).toBe(0);
}

test("real completed homework opens from the list and preserves answers, statuses and CODE UI", async ({ page }) => {
  test.setTimeout(120_000);
  await login(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await screenshot(page, "student-dashboard-real-1440");
  const homework = await getHomework(page, "COMPLETED");
  await page.getByRole("link", { name: "Все задания", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Домашние задания" })).toBeVisible();
  const homeworkLink = page.locator(`main a[href="/student/homework/${homework.id}"]`);
  await expect(homeworkLink).toBeVisible();
  await screenshot(page, "student-homework-list-real-1440");
  await homeworkLink.click();
  await expect(page.getByRole("heading", { level: 1, name: homework.title })).toBeVisible();
  const textTask =
    homework.items.find((item) => item.task.taskType === "TEXT" && item.latestSubmissionStatus === "NEEDS_REVIEW") ??
    homework.items.find((item) => item.task.taskType === "TEXT")!;
  const action = page.getByRole("button", { name: `Открыть: ${textTask.task.title}`, exact: true });
  await action.focus();
  await expect(action).toBeFocused();
  await page.keyboard.press("Enter");
  const solution = page.getByRole("region", { name: textTask.task.title, exact: true });
  await expect(solution.getByRole("note")).toContainText("Домашнее задание завершено");
  const response = await page.request.get(
    `/api/v1/student/tasks/${textTask.taskId}/submissions?homeworkItemId=${textTask.id}&page=0&size=20`,
  );
  const submissions: StudentSubmissionPage = await response.json();
  const latest = [...submissions.items].sort((a, b) => b.attemptNo - a.attemptNo)[0];
  if (latest?.textAnswer) {
    await expect(solution.getByRole("textbox", { name: "Ваш ответ" })).toHaveValue(latest.textAnswer);
    await expect(solution.getByRole("textbox", { name: "Ваш ответ" })).toHaveAttribute("readonly", "");
  }
  await expect(solution.getByRole("button", { name: "Отправить", exact: true })).toHaveCount(0);
  if (latest)
    await expect(solution.getByRole("region", { name: "История попыток" })).toContainText(
      `Попытка ${latest.attemptNo}`,
    );
  const required = homework.items.filter((item) => item.required);
  const expected = required.length ? (required.filter((item) => item.passed).length / required.length) * 100 : 0;
  await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", String(expected));
  await page.getByRole("heading", { level: 1 }).click();
  for (const width of widths) {
    await page.setViewportSize({ width, height: 1000 });
    await noOverflow(page);
    const main = await page.locator("main").boundingBox();
    expect(main!.width).toBeLessThanOrEqual(1152);
    if (width === 1440 || width === 390) await screenshot(page, `student-homework-detail-real-${width}`);
  }
  const codeTask = homework.items.find((item) => item.task.taskType === "CODE")!;
  await page.getByRole("button", { name: `Открыть: ${codeTask.task.title}`, exact: true }).click();
  const editorContent = page.locator(".monaco-editor .view-lines");
  const originalCode = await editorContent.innerText();
  await fillCodeEditor(page, "readonly editor must keep its code");
  await expect(editorContent).toHaveText(originalCode);
  await expect(page.getByRole("button", { name: "Запустить", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Отправить решение" })).toBeDisabled();
  await noOverflow(page);
  await page.locator("main").getByRole("link", { name: "Домашние задания", exact: true }).click();
  await expect(page).toHaveURL(/\/student\/homework$/);
});

test("real assigned homework keeps the specialized code run and submit flow", async ({ page }) => {
  test.setTimeout(120_000);
  await login(page);
  const homework = await getHomework(page, "ASSIGNED");
  await page.goto(`/student/homework/${homework.id}`);
  const codeTask = homework.items.find((item) => item.task.taskType === "CODE")!;
  await page.getByRole("button", { name: `Открыть: ${codeTask.task.title}`, exact: true }).click();
  await expect(page.locator(".monaco-editor .view-lines")).toContainText(
    codeTask.task.codeExecution?.starterCode?.split("\n")[0] ?? "",
  );
  await fillCodeEditor(page, 'print("Hello, World!")');
  await page.getByRole("button", { name: "Запустить", exact: true }).click();
  const run = page.getByRole("region", { name: "Результат запуска" });
  await expect(run).toBeVisible({ timeout: 60_000 });
  await expect(run).toContainText("Тесты:");
  await page.getByRole("button", { name: "Отправить решение" }).click();
  const result = page.getByRole("region", { name: "Результат отправки" });
  await expect(result).toBeVisible({ timeout: 60_000 });
  await expect(result).toContainText("Попытка");
  await expect(page.getByRole("region", { name: "История попыток" })).toBeVisible();
  for (const width of widths) {
    await page.setViewportSize({ width, height: 1000 });
    await noOverflow(page);
  }
  await screenshot(page, "student-homework-code-real-390");
});

test("long API content, many attempts and absent optional metadata fit all widths", async ({ page }) => {
  test.setTimeout(120_000);
  await login(page);
  const homework = await getHomework(page, "COMPLETED");
  const textTask = homework.items.find((item) => item.task.taskType === "TEXT")!;
  const realResponse = await page.request.get(
    `/api/v1/student/tasks/${textTask.taskId}/submissions?homeworkItemId=${textTask.id}&page=0&size=20`,
  );
  const attempts: StudentSubmissionPage = await realResponse.json();
  const realAttempt = attempts.items[0];
  const detail: StudentHomeworkDetails = {
    ...homework,
    title: homework.title.repeat(8),
    dueAt: null,
    completedAt: null,
    description: null,
    items: Array.from({ length: 12 }, (_, i) => ({
      ...textTask,
      id: `long-item-${i}`,
      position: i,
      task: {
        ...textTask.task,
        title: textTask.task.title.repeat(8),
        descriptionMarkdown: textTask.task.descriptionMarkdown.repeat(12),
      },
    })),
  };
  await page.route(`**/api/v1/student/homeworks/${homework.id}`, (route) => route.fulfill({ json: detail }));
  await page.route("**/api/v1/student/tasks/*/submissions?*", (route) =>
    route.fulfill({
      json: {
        ...attempts,
        items: realAttempt
          ? Array.from({ length: 12 }, (_, i) => ({
              ...realAttempt,
              id: `attempt-${i}`,
              attemptNo: i + 1,
              textAnswer: realAttempt.textAnswer?.repeat(30),
            }))
          : [],
      },
    }),
  );
  await page.goto(`/student/homework/${homework.id}`);
  await page
    .getByRole("button", { name: /^Открыть:/ })
    .first()
    .click();
  await expect(page.getByRole("list", { name: "Задания" }).getByRole("listitem")).toHaveCount(12);
  for (const width of widths) {
    await page.setViewportSize({ width, height: 1000 });
    await noOverflow(page);
  }
  await screenshot(page, "student-homework-detail-long-390");
  detail.items = [detail.items[0]];
  await page.reload();
  await expect(page.getByRole("list", { name: "Задания" }).getByRole("listitem")).toHaveCount(1);
  await expect(page.locator("dl time")).toHaveCount(1);
});
