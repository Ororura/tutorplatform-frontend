import { expect, test, type Page } from "@playwright/test";
import type { components } from "../src/shared/api/generated/schema";
import {
  activateProgram,
  createProgram,
  expectMobileLayout,
  importPackage,
  login,
  previewPackage,
  uniqueName,
} from "./helpers/journeys";

type AttentionPage = components["schemas"]["TeacherDashboardAttentionPageResponse"];
type AttentionType = components["schemas"]["AttentionItem"]["type"];

async function openQueueItem(page: Page, type: AttentionType, resourceId: string, label: string) {
  let targetPage = 0;
  for (let index = 0; ; index++) {
    const response = await page.request.get("/api/v1/teacher/dashboard/attention", {
      params: { type, page: index, size: 20 },
    });
    expect(response.status()).toBe(200);
    const data = (await response.json()) as AttentionPage;
    if (data.items.some((item) => item.resourceId === resourceId)) {
      targetPage = index;
      break;
    }
    if (index + 1 >= data.totalPages) throw new Error(`Queue item missing: ${resourceId}`);
  }
  const queue = page.getByRole("region", { name: "Рабочая очередь" });
  await queue.getByRole("button", { name: label, exact: true }).click();
  for (let index = 0; index < targetPage; index++) {
    await queue.getByRole("button", { name: "Вперёд", exact: true }).click();
    await expect(queue.getByText(new RegExp(`^Страница ${index + 2} из`))).toBeVisible();
  }
  const link = queue.locator(`a[href$="/${resourceId}"]`);
  await expect(link).toBeVisible();
  await link.click();
}

async function assignHomework(
  page: Page,
  studentId: string,
  programId: string,
  taskTitle: string,
  title: string,
  overdue: boolean,
) {
  await page.goto(`/teacher/students/${studentId}/homework/new`);
  await page.getByLabel("Программа обучения").selectOption(programId);
  await page.getByLabel("Название", { exact: true }).fill(title);
  if (overdue) {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const local = new Date(yesterday.getTime() - yesterday.getTimezoneOffset() * 60 * 1000).toISOString().slice(0, 16);
    await page.getByLabel("Срок", { exact: true }).fill(local);
  }
  // Imported task is newest; still navigate the actual picker if other data grew.
  const picker = page.getByRole("group", { name: "Выбрать задания" });
  await expect(picker.getByRole("checkbox").first()).toBeVisible();
  while ((await picker.getByRole("checkbox", { name: new RegExp(taskTitle) }).count()) === 0) {
    const next = picker.getByRole("button", { name: "Вперёд", exact: true });
    await expect(next).toBeEnabled();
    const oldPage = await picker.getByText(/^Страница \d+ из/).innerText();
    await next.click();
    await expect(picker.getByText(/^Страница \d+ из/)).not.toHaveText(oldPage);
    await expect(picker.getByRole("checkbox").first()).toBeVisible();
  }
  await picker.getByRole("checkbox", { name: new RegExp(taskTitle) }).check();
  await page.getByRole("button", { name: "Назначить", exact: true }).click();
  await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
  return new URL(page.url()).pathname.split("/")[5];
}

test("teacher daily workflow uses real review, overdue homework, student context and reports", async ({
  page,
  browser,
  baseURL,
}, testInfo) => {
  test.setTimeout(180_000);
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  const title = uniqueName("M18 daily");
  const taskTitle = `${title} TEXT`;
  await login(page, "teacher");
  await createProgram(page, title);
  const { dialog } = await previewPackage(
    page,
    `schemaVersion: 2
kind: modules
modules:
  - title: Daily module
    topics:
      - title: Daily topic
        tasks:
          - title: ${taskTitle}
            descriptionMarkdown: Explain your solution in words.
            taskType: TEXT
            difficulty: EASY
            required: true
`,
  );
  await importPackage(dialog);
  await activateProgram(page);
  // Imported tasks are drafts; use the existing editor to make this task assignable.
  let taskId = "";
  for (let index = 0; ; index++) {
    const response = await page.request.get("/api/v1/teacher/tasks", {
      params: { page: index, size: 100, status: "DRAFT" },
    });
    expect(response.status()).toBe(200);
    const data = (await response.json()) as components["schemas"]["TaskPageResponse"];
    const task = data.items.find((item) => item.title === taskTitle);
    if (task) {
      taskId = task.id;
      break;
    }
    if (index + 1 >= data.totalPages) throw new Error("Imported draft task was not found");
  }
  await page.goto(`/teacher/tasks/${taskId}`);
  await page.getByRole("button", { name: "Редактировать", exact: true }).click();
  const taskEditor = page
    .getByRole("dialog")
    .filter({ has: page.getByRole("heading", { name: "Редактировать задание", exact: true }) });
  await taskEditor.getByRole("combobox", { name: "Статус", exact: true }).selectOption("ACTIVE");
  await taskEditor.getByRole("button", { name: "Сохранить", exact: true }).click();
  await expect(taskEditor).toBeHidden();
  await page.goto("/teacher/students");
  await page.getByLabel("Поиск ученика").fill("Алексей");
  await expect(page).toHaveURL(/search=/);
  await page.getByRole("link", { name: /Алексей Иванов/ }).click();
  await expect(page.getByRole("heading", { name: "Алексей Иванов", exact: true })).toBeVisible();
  const studentId = new URL(page.url()).pathname.split("/")[3];
  await page.getByRole("link", { name: "Программа", exact: true }).click();
  await page.getByRole("button", { name: /^Назначить (ещё )?программу$/ }).click();
  const assignment = page.getByRole("dialog", { name: "Назначить программу" });
  await assignment.getByRole("radio", { name: title }).check();
  await assignment.getByLabel("Интервал отчёта, часов").fill("1");
  await assignment.getByRole("button", { name: "Назначить", exact: true }).click();
  await expect(page).toHaveURL(/\/programs\/[^/]+$/);
  const programId = new URL(page.url()).pathname.split("/")[5];
  await page.goto(`/teacher/students/${studentId}/sessions/new`);
  await page.getByLabel("Программа обучения").selectOption(programId);
  await page.getByLabel("Длительность, минут").fill("60");
  await page.getByRole("checkbox", { name: "Daily topic", exact: true }).check();
  await page.getByRole("button", { name: "Создать занятие", exact: true }).click();
  await expect(page).toHaveURL(/\/sessions\/(?!new$)[^/]+$/);
  const homeworkId = await assignHomework(page, studentId, programId, taskTitle, `${title} review`, false);
  const overdueId = await assignHomework(page, studentId, programId, taskTitle, `${title} overdue`, true);
  const studentContext = await browser.newContext({ baseURL });
  let submissionId: string;
  const answer = `${title}: my independently created answer`;
  try {
    const student = await studentContext.newPage();
    await login(student, "student", `/student/homework/${homeworkId}`);
    await student.getByRole("button", { name: `Открыть: ${taskTitle}`, exact: true }).click();
    await student.getByLabel("Ваш ответ", { exact: true }).fill(answer);
    const submitted = student.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        /\/api\/v1\/student\/tasks\/[^/]+\/submissions$/.test(new URL(response.url()).pathname),
    );
    await student.getByRole("button", { name: "Отправить", exact: true }).click();
    const response = await submitted;
    expect(response.status()).toBe(201);
    const data = await response.json();
    expect(data.status).toBe("NEEDS_REVIEW");
    submissionId = data.id;
  } finally {
    await studentContext.close();
  }

  await page.goto("/teacher");
  await expect(page.getByRole("heading", { name: "Рабочая очередь" })).toBeVisible();
  await openQueueItem(page, "SUBMISSION_NEEDS_REVIEW", submissionId, "На проверку");
  const review = page.getByRole("region", { name: "Ответ ученика" });
  await expect(review.getByText(answer, { exact: true })).toBeVisible();
  await expect(review.getByText("Попытка 1", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: taskTitle, exact: true })).toBeVisible();
  await page.setViewportSize({ width: 375, height: 900 });
  await expectMobileLayout(page, review.getByRole("button", { name: "Принять", exact: true }));
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: testInfo.outputPath("review-375.png"), fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await review.getByRole("button", { name: "Принять", exact: true }).click();
  await expect(review.getByRole("status")).toContainText("Изменения сохранены.");
  await expect(review.getByRole("button", { name: "Принять", exact: true })).toHaveCount(0);
  const persisted = await page.request.get(`/api/v1/teacher/students/${studentId}/submissions/${submissionId}`);
  expect((await persisted.json()).status).toBe("PASSED");
  expect(
    (await (await page.request.get(`/api/v1/teacher/students/${studentId}/homeworks/${homeworkId}`)).json()).status,
  ).toBe("COMPLETED");
  const remainingResponse = await page.request.get("/api/v1/teacher/dashboard/attention", {
    params: { type: "SUBMISSION_NEEDS_REVIEW", page: 0, size: 1 },
  });
  const remaining = (await remainingResponse.json()) as AttentionPage;
  if (remaining.items.length > 0) {
    await page.getByRole("link", { name: /Следующая работа/ }).click();
    await expect(page).toHaveURL(new RegExp(`/submissions/${remaining.items[0].resourceId}$`));
    await expect(page.getByRole("region", { name: "Ответ ученика" })).toBeVisible();
  } else {
    await expect(page.getByText("Все ожидающие работы проверены.")).toBeVisible();
  }
  await page.getByRole("link", { name: "← Рабочая очередь", exact: true }).click();
  const queue = page.getByRole("region", { name: "Рабочая очередь" });
  await expect(queue.getByRole("link").first()).toBeVisible();
  await expect(queue.locator(`a[href$="/${submissionId}"]`)).toHaveCount(0);
  for (const width of [375, 768, 1280, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await expectMobileLayout(page, queue.getByRole("button", { name: "На проверку", exact: true }));
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: testInfo.outputPath(`queue-${width}.png`), fullPage: true });
  }
  await openQueueItem(page, "HOMEWORK_OVERDUE", overdueId, "Просрочено");
  await expect(page.getByRole("heading", { name: `${title} overdue`, exact: true })).toBeVisible();
  await page.getByRole("link", { name: "← Домашние задания", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Домашние задания", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Профиль ученика", exact: true }).click();
  const context = page.getByRole("region", { name: "Учебная ситуация" });
  await expect(context.getByRole("link", { name: /Последнее проведённое занятие/ })).not.toContainText("Загружаем");
  const actions = page.getByRole("region", { name: "Быстрые действия с учеником" });
  for (const [label, suffix] of [
    ["Создать занятие", "sessions/new"],
    ["Назначить домашнее задание", "homework/new"],
    ["Открыть прогресс", "progress"],
    ["Открыть отчёты", "reports"],
  ]) {
    await expect(actions.getByRole("link", { name: label, exact: true })).toHaveAttribute(
      "href",
      `/teacher/students/${studentId}/${suffix}`,
    );
  }
  for (const width of [375, 768, 1280, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await expectMobileLayout(page, actions.getByRole("link", { name: "Создать занятие", exact: true }));
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: testInfo.outputPath(`context-${width}.png`), fullPage: true });
  }
  await actions.getByRole("link", { name: "Создать занятие", exact: true }).focus();
  await page.keyboard.press("Tab");
  await expect(actions.getByRole("link", { name: "Назначить домашнее задание", exact: true })).toBeFocused();
  const focusVisible = await actions
    .getByRole("link", { name: "Назначить домашнее задание", exact: true })
    .evaluate((element) => {
      const style = getComputedStyle(element);
      return style.outlineStyle !== "none" || style.boxShadow !== "none";
    });
  expect(focusVisible).toBe(true);
  const ready = context.getByRole("link", { name: /Готовые отчётные периоды.*Открыть период/ });
  const readyHref = await ready.getAttribute("href");
  await ready.click();
  if (new URL(readyHref!, baseURL).searchParams.has("learningPeriodId")) {
    await expect(page.getByText("Выбран из рабочей очереди", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Программа обучения")).toHaveValue(
      new URL(readyHref!, baseURL).searchParams.get("studentProgramId")!,
    );
  } else {
    await expect(page.getByRole("heading", { name: "Результаты периода", exact: true })).toBeVisible();
  }
  expect(pageErrors).toEqual([]);
});
