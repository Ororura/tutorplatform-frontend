import { expect, test, type Page } from "@playwright/test";

import type { components } from "../src/shared/api/generated/schema";

import { login, uniqueName } from "./helpers/journeys";

async function findPage<T extends { title: string }>(
  page: Page,
  endpoint: string,
  params: Record<string, string | number>,
  title: string,
) {
  // Locate persisted seed records without assuming mutable collections fit on page 1.
  for (let index = 0; ; index++) {
    const response = await page.request.get(endpoint, { params: { ...params, page: index } });
    expect(response.status()).toBe(200);
    const collection = (await response.json()) as { items: T[]; totalPages: number };
    const item = collection.items.find((item) => item.title === title);
    if (item) return { index, item };
    if (index + 1 >= collection.totalPages) throw new Error(`Expected record not found: ${title}`);
  }
}

test("teacher assigns TEXT + CODE homework and reviews resubmitted TEXT through completion", async ({
  page,
  browser,
  baseURL,
}) => {
  test.setTimeout(120_000);
  await page.goto("/login?next=%2Fteacher%2Fstudents");
  await page.getByLabel("Email", { exact: true }).fill("teacher.demo@tutor.local");
  await page.getByLabel("Пароль", { exact: true }).fill("DemoTeacher123!");
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page).toHaveURL(/\/teacher\/students$/);

  await page.getByRole("link", { name: "Задания", exact: true }).click();
  await expect(page).toHaveURL(/\/teacher\/tasks$/);
  await expect(page.getByRole("heading", { name: "Банк заданий", level: 1 })).toBeVisible();
  for (const [title, label] of [
    ["Когда использовать цикл while?", /Когда использовать цикл while.*Текстовый ответ/],
    ["Сумма двух чисел", /Сумма двух чисел.*Код/],
  ] as const) {
    const { index } = await findPage(page, "/api/v1/teacher/tasks", { size: 20, sort: "updatedAt,desc" }, title);
    await page.goto(`/teacher/tasks?page=${index}`);
    await expect(page.getByRole("link", { name: label })).toBeVisible();
  }
  await page.getByRole("link", { name: /Сумма двух чисел/ }).click();
  await expect(page.getByRole("heading", { name: "Конфигурация кода" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Тесты" })).toBeVisible();
  await expect(page.getByText("Скрытый · NORMALIZED").first()).toBeVisible();

  await page.goto("/teacher/students");
  await page.getByLabel("Поиск ученика").fill("Алексей");
  await expect(page).toHaveURL(/search=/);
  await page.getByRole("link", { name: /Алексей Иванов/ }).click();
  await expect(page).toHaveURL(/\/teacher\/students\/[^/]+$/);
  const studentId = new URL(page.url()).pathname.split("/")[3];
  await page.getByRole("link", { name: "Домашние задания", exact: true }).click();
  for (const [title, label] of [
    ["Циклы", /Циклы.*Назначено/],
    ["Практика со списками", /Практика со списками.*Просрочено/],
    ["Повторение основ", /Повторение основ.*Отменено/],
    ["Основы Python", /Основы Python.*Выполнено/],
  ] as const) {
    const { index } = await findPage(
      page,
      `/api/v1/teacher/students/${studentId}/homeworks`,
      { size: 20, sort: "assignedAt,desc" },
      title,
    );
    await page.goto(`/teacher/students/${studentId}/homework?page=${index}`);
    await expect(page.getByRole("link", { name: label })).toBeVisible();
  }
  await page
    .getByRole("link", {
      name: /Основы Python/,
    })
    .click();

  await expect(page).toHaveURL(/\/teacher\/students\/[^/]+\/homework\/[^/?]+$/);

  await expect(
    page.getByRole("heading", {
      name: "Задания",
      exact: true,
      level: 2,
    }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Выведи Hello, World!" })).toBeVisible();

  await page.getByRole("link", { name: "Домашние задания" }).click();
  await page.getByRole("link", { name: "Назначить домашнее задание" }).first().click();
  const program = page.getByLabel("Программа обучения");
  const pythonProgram = program.locator("option").filter({ hasText: /Python с нуля/ });
  await expect(pythonProgram).toBeAttached();
  const programId = await pythonProgram.getAttribute("value");
  expect(programId).toBeTruthy();
  await program.selectOption(programId!);
  const programsResponse = await page.request.get(`/api/v1/teacher/students/${studentId}/programs`);
  expect(programsResponse.status()).toBe(200);
  const programs = (await programsResponse.json()) as components["schemas"]["StudentProgramSummaryResponse"][];
  const subjectId = programs.find((program) => program.id === programId)!.subject.id;
  const title = uniqueName("TEXT CODE");
  await page.getByLabel("Название").fill(title);
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const pad = (value: number) => String(value).padStart(2, "0");
  const dueAt = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}T${pad(
    tomorrow.getHours(),
  )}:${pad(tomorrow.getMinutes())}`;
  await page.getByLabel("Срок").fill(dueAt);
  const taskSelection = page.getByRole("group", { name: "Выбрать задания" });
  let selectionPage = 0;
  for (const title of ["Разница между = и ==", "Сумма двух чисел"]) {
    const { index } = await findPage(
      page,
      "/api/v1/teacher/tasks",
      {
        size: 10,
        sort: "updatedAt,desc",
        status: "ACTIVE",
        subjectId,
      },
      title,
    );
    while (selectionPage !== index) {
      const direction = selectionPage < index ? "Вперёд" : "Назад";
      const button = taskSelection.getByRole("button", { name: direction, exact: true });
      await expect(button).toBeEnabled();
      await button.click();
      selectionPage += selectionPage < index ? 1 : -1;
      await expect(taskSelection.getByText(new RegExp(`^Страница ${selectionPage + 1} из`))).toBeVisible();
    }
    await taskSelection.getByRole("checkbox", { name: new RegExp(title) }).check();
  }
  const required = page.getByRole("checkbox", { name: "Обязательное" });
  await required.nth(1).uncheck();
  await page.getByRole("button", { name: "Назначить", exact: true }).click();
  await expect(page).toHaveURL(/\/teacher\/students\/[^/]+\/homework\/[^/]+$/);
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await expect(page.getByRole("link", { name: "Разница между = и ==" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Сумма двух чисел" })).toBeVisible();
  await expect(page.getByText("Необязательное")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();

  const teacherPath = new URL(page.url()).pathname;
  const homeworkId = teacherPath.split("/")[5];
  const studentContext = await browser.newContext({ baseURL });
  try {
    const student = await studentContext.newPage();
    await login(student, "student", "/student/homework");
    await student.getByRole("link", { name: new RegExp(title) }).click();
    await expect(student).toHaveURL(new RegExp(`/student/homework/${homeworkId}$`));
    const detail = await student.request.get(`/api/v1/student/homeworks/${homeworkId}`);
    expect(detail.status()).toBe(200);
    const homework = await detail.json();
    const textItem = homework.items.find((item: { task: { taskType: string } }) => item.task.taskType === "TEXT");
    expect(textItem.required).toBe(true);
    expect(homework.items.find((item: { task: { taskType: string } }) => item.task.taskType === "CODE").required).toBe(
      false,
    );
    await student.getByRole("button", { name: "Открыть: Разница между = и ==", exact: true }).click();

    for (const [index, status] of ["FAILED", "PASSED"].entries()) {
      const answer = `${title}: ${index === 0 ? "First answer" : "= assigns a value; == compares values"}`;
      await student.getByLabel("Ваш ответ", { exact: true }).fill(answer);
      const submitted = student.waitForResponse(
        (response) =>
          response.request().method() === "POST" &&
          new URL(response.url()).pathname === `/api/v1/student/tasks/${textItem.taskId}/submissions`,
      );
      await student.getByRole("button", { name: "Отправить", exact: true }).click();
      const response = await submitted;
      expect(response.status()).toBe(201);
      const submission = await response.json();
      expect(submission).toMatchObject({
        homeworkItemId: textItem.id,
        taskId: textItem.taskId,
        textAnswer: answer,
        status: "NEEDS_REVIEW",
        attemptNo: index + 1,
      });
      await expect(student.getByText("Ожидает проверки", { exact: true }).first()).toBeVisible();
      expect((await (await student.request.get(`/api/v1/student/homeworks/${homeworkId}`)).json()).status).toBe(
        "ASSIGNED",
      );

      await page.goto(teacherPath);
      const review = page.getByRole("region", { name: "Ответ ученика" });
      await expect(review.getByText(answer, { exact: true })).toBeVisible();
      await expect(review.getByText("Ожидает проверки", { exact: true })).toBeVisible();
      const reviewed = page.waitForResponse(
        (response) =>
          response.request().method() === "PATCH" &&
          new URL(response.url()).pathname ===
            `/api/v1/teacher/students/${studentId}/submissions/${submission.id}/review`,
      );
      await review.getByRole("button", { name: status === "PASSED" ? "Принять" : "Не принять", exact: true }).click();
      expect((await reviewed).status()).toBe(200);
      await expect(review.getByText(status === "PASSED" ? "Принято" : "Не принято", { exact: true })).toBeVisible();

      await student.reload();
      await student.getByRole("button", { name: "Открыть: Разница между = и ==", exact: true }).click();
      await expect(
        student.getByText(status === "PASSED" ? "Выполнено" : "Не принято", { exact: true }).first(),
      ).toBeVisible();
      const persisted = await student.request.get(`/api/v1/student/submissions/${submission.id}`);
      expect(persisted.status()).toBe(200);
      expect(await persisted.json()).toMatchObject({ id: submission.id, status, textAnswer: answer });
    }
    const completedResponse = await student.request.get(`/api/v1/student/homeworks/${homeworkId}`);
    expect(completedResponse.status()).toBe(200);
    const completed = await completedResponse.json();
    expect(completed.status).toBe("COMPLETED");
    expect(completed.completedAt).toBeTruthy();
    expect(completed.items.find((item: { id: string }) => item.id === textItem.id).passed).toBe(true);
    expect(completed.items.find((item: { task: { taskType: string } }) => item.task.taskType === "CODE").passed).toBe(
      false,
    );
    await expect(student.getByRole("region", { name: "Прогресс работы" })).toContainText(
      "Выполнено 1 из 1 обязательных заданий",
    );
    await page.reload();
    await expect(page.getByText("Выполнено", { exact: true }).first()).toBeVisible();
  } finally {
    await studentContext.close();
  }
});
