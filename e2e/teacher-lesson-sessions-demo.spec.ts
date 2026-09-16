import { expect, test } from "@playwright/test";

test("demo teacher reads Alex session history and creates a real session", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill("teacher.demo@tutor.local");
  await page.getByLabel("Пароль", { exact: true }).fill("DemoTeacher123!");
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page).toHaveURL(/\/teacher\/students$/);

  await page.getByLabel("Поиск ученика").fill("Алексей");
  await page.getByRole("link", { name: /Алексей Иванов/ }).click();
  await page.getByRole("link", { name: "Занятия", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Занятия" })).toBeVisible();
  await expect(page.getByText("Проведено").first()).toBeVisible();
  await expect(page.getByText("Пропущено")).toBeVisible();
  await expect(page.getByText("Отменено")).toBeVisible();

  await page.getByText("Цикл while и условия остановки.").click();
  await expect(page.getByText("Списки", { exact: true })).toBeVisible();
  await expect(page.getByText("DEMO PRIVATE: нужно повторить циклы")).toBeVisible();
  await page.reload();
  await expect(page.getByText("DEMO PRIVATE: нужно повторить циклы")).toBeVisible();

  await page.getByRole("link", { name: "Все занятия" }).click();
  await page.getByRole("link", { name: "Добавить занятие" }).click();
  await expect(page.getByLabel("Программа обучения")).toHaveValue(/.+/);
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
  await expect(page.getByText(summary)).toBeVisible();
});
