import { expect, test, type Page } from "@playwright/test";

import type { components } from "../src/shared/api/generated/schema";

type Session = components["schemas"]["LessonSessionSummaryResponse"];

async function findSessionInHistory(page: Page, studentId: string, matches: (session: Session) => boolean) {
  // Repeated runs add attended sessions. Read the page index before opening the
  // real list UI so seed history and new sessions remain reachable after page 1.
  for (let index = 0; ; index++) {
    const response = await page.request.get(`/api/v1/teacher/students/${studentId}/sessions`, {
      params: { page: index, size: 20, sort: "startedAt,desc" },
    });
    expect(response.status()).toBe(200);
    const history = (await response.json()) as components["schemas"]["LessonSessionPageResponse"];
    const session = history.items.find(matches);
    if (session) {
      await page.goto(`/teacher/students/${studentId}/sessions?page=${index}`);
      const link = page.locator(`a[href="/teacher/students/${studentId}/sessions/${session.id}"]`);
      await expect(link).toBeVisible();
      return link;
    }
    if (index + 1 >= history.totalPages) throw new Error("Expected session was not found in paginated history");
  }
}

test("demo teacher reads Alex session history and creates a real session", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/login?next=%2Fteacher%2Fstudents");
  await page.getByLabel("Email", { exact: true }).fill("teacher.demo@tutor.local");
  await page.getByLabel("Пароль", { exact: true }).fill("DemoTeacher123!");
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page).toHaveURL(/\/teacher\/students$/);

  await page.getByLabel("Поиск ученика").fill("Алексей");

  await expect(page).toHaveURL(/search=/);

  const alexLink = page.getByRole("link", {
    name: /Алексей Иванов/,
  });

  await expect(alexLink).toBeVisible();
  await alexLink.click();

  await expect(page).toHaveURL(/\/teacher\/students\/[^/?]+$/);

  await expect(page.getByRole("heading", { name: "Алексей Иванов" })).toBeVisible();
  const studentId = new URL(page.url()).pathname.split("/")[3];

  await page.getByRole("navigation", { name: "Разделы ученика" }).getByRole("link", { name: "Занятия" }).click();

  await expect(page).toHaveURL(/\/teacher\/students\/[^/]+\/sessions$/);
  await expect(page.getByRole("heading", { name: "Занятия", level: 1, exact: true })).toBeVisible();
  for (const [status, label] of [
    ["ATTENDED", "Проведено"],
    ["MISSED", "Пропущено"],
    ["CANCELLED", "Отменено"],
  ] as const) {
    await expect(
      await findSessionInHistory(page, studentId, (session) => session.attendanceStatus === status),
    ).toContainText(label);
  }

  await (
    await findSessionInHistory(page, studentId, (session) => session.summary === "Цикл while и условия остановки.")
  ).click();
  await expect(page.getByText("Списки", { exact: true })).toBeVisible();
  await expect(page.getByText("DEMO PRIVATE: нужно повторить циклы")).toBeVisible();
  await page.reload();
  await expect(page.getByText("DEMO PRIVATE: нужно повторить циклы")).toBeVisible();

  await page.getByRole("link", { name: "Все занятия" }).click();
  await page.getByRole("link", { name: "Добавить занятие" }).click();
  const program = page.getByLabel("Программа обучения");
  const pythonOption = program.locator("option").filter({ hasText: /^Python с нуля/ });
  await expect(pythonOption).toBeAttached();
  await program.selectOption((await pythonOption.getAttribute("value"))!);
  const progressContext = await page.evaluate(async () => {
    const studentId = location.pathname.split("/")[3];
    const studentProgramId = (document.querySelector("#session-program") as HTMLSelectElement).value;
    const response = await fetch(`/api/v1/teacher/students/${studentId}/progress?studentProgramId=${studentProgramId}`);
    const progress = (await response.json()) as { totalLearningMinutes: number };
    return { studentId, studentProgramId, learningMinutes: progress.totalLearningMinutes };
  });
  await page.getByLabel("Дата и время").fill("2026-09-13T12:34");
  await page.getByLabel("Длительность, минут").fill("60");
  await page.getByRole("checkbox", { name: "Переменные и типы данных" }).check();
  await page.locator('input[name="primaryTopic"]:not([disabled])').check();
  const summary = `E2E занятие ${Date.now()}`;
  await page.getByLabel("Краткое описание занятия").fill(summary);
  await page.getByLabel("Личные заметки").fill("E2E private teacher note");
  await page.getByRole("button", { name: "Создать занятие" }).click();
  await expect(page).toHaveURL(/\/teacher\/students\/[^/]+\/sessions\/(?!new$)[^/]+$/);
  const createdSessionId = new URL(page.url()).pathname.split("/")[5];
  await expect(page.getByRole("heading", { name: /13 сентября/ })).toBeVisible();
  await expect(page.getByText(summary)).toBeVisible();
  await expect(page.getByText("E2E private teacher note")).toBeVisible();
  await expect(page.getByText("Переменные и типы данных")).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(async ({ studentId, studentProgramId }) => {
        const response = await fetch(
          `/api/v1/teacher/students/${studentId}/progress?studentProgramId=${studentProgramId}`,
        );
        return ((await response.json()) as { totalLearningMinutes: number }).totalLearningMinutes;
      }, progressContext),
    )
    .toBe(progressContext.learningMinutes + 60);
  await page.reload();
  await expect(page.getByText(summary)).toBeVisible();
  await page.getByRole("link", { name: "Все занятия" }).click();
  await expect(await findSessionInHistory(page, studentId, (session) => session.id === createdSessionId)).toContainText(
    summary,
  );
});
