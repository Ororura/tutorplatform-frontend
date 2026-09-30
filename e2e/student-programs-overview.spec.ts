import { expect, test, type Page } from "@playwright/test";

import type { CurrentProgress } from "../src/entities/progress";
import type { StudentProgramDetails, StudentProgramSummary } from "../src/entities/student-program";

const widths = [1536, 1440, 1280, 1024, 768, 390];

async function login(page: Page) {
  await page.goto("/login?next=%2Fstudent");
  await page.getByLabel("Email", { exact: true }).fill("alex.demo@tutor.local");
  await page.getByLabel("Пароль", { exact: true }).fill("DemoStudent123!");
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page.getByRole("heading", { name: "Добрый день, Алексей!" })).toBeVisible();
}

async function screenshot(page: Page, name: string) {
  const path = test.info().outputPath(`${name}.png`);
  await page.screenshot({ path, fullPage: true });
  await test.info().attach(name, { path, contentType: "image/png" });
}

test("real student programs share dashboard surfaces and remain usable at all widths", async ({ page }) => {
  test.setTimeout(90_000);
  await login(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(
    page.getByRole("region", { name: "Моя программа", exact: true }).getByRole("progressbar").first(),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Домашние задания", exact: true }).getByRole("article").first(),
  ).toBeVisible();
  await screenshot(page, "student-dashboard-real-1440");
  await page.getByRole("link", { name: "Все программы", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Мои программы" })).toBeVisible();
  const current = page.getByRole("region", { name: /^Текущ(ая программа|ие программы)$/ });
  const article = current.getByRole("article", { name: "Python с нуля", exact: true });
  await expect(article.getByRole("progressbar")).toBeVisible();
  await expect(article.getByText("Активна", { exact: true })).toBeVisible();
  await expect(page.getByText(/Всего программ/)).toHaveCount(0);
  for (const width of widths) {
    await page.setViewportSize({ width, height: 1000 });
    await expect(current).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    if (width === 1440 || width === 390) await screenshot(page, `student-programs-real-${width}`);
  }
  const action = article.getByRole("link", { name: /Продолжить обучение|Открыть программу/ });
  const href = await action.getAttribute("href");
  expect(href).toMatch(/^\/student\/programs\/[^/]+(?:\/topics\/[^/]+)?$/);
  await action.click();
  await expect(page).toHaveURL(href!);
});

const program: StudentProgramSummary = {
  id: "overview-program",
  learningProgramId: "learning-program",
  title: "Python: основы программирования и практическая работа с данными",
  description: "Базовая программа с практикой и домашними заданиями. ".repeat(8),
  status: "ACTIVE",
  startedAt: "2026-09-01T00:00:00Z",
  reportIntervalMinutes: 60,
  subject: { id: "subject", name: "Python", code: "PYTHON" },
};
const details: StudentProgramDetails = {
  ...program,
  modules: [
    {
      id: "module",
      title: "Управление программой и обработка данных",
      position: 0,
      topics: [
        {
          id: "topic",
          title: "Циклы и работа с большими коллекциями данных: подробная практическая тема",
          position: 0,
          topicStatus: "ACTIVE",
          progressStatus: "IN_PROGRESS",
        },
      ],
    },
  ],
};
const progress: CurrentProgress = {
  totalTopics: 9,
  topics: { completed: Array.from({ length: 5 }, (_, i) => ({ id: `completed-${i}` })) },
};

test("mixed statuses and long optional content preserve current-program hierarchy", async ({ page }) => {
  test.setTimeout(90_000);
  await login(page);
  const programs: StudentProgramSummary[] = [
    program,
    { ...program, id: "paused", title: "Практический проект", status: "PAUSED", description: null },
    { ...program, id: "completed", title: "Веб-скрейпинг и анализ данных", status: "COMPLETED" },
    { ...program, id: "archived", title: "Архивная программа", status: "ARCHIVED" },
  ];
  await page.route("**/api/v1/student/programs", (route) => route.fulfill({ json: programs }));
  await page.route("**/api/v1/student/programs/overview-program", (route) => route.fulfill({ json: details }));
  await page.route("**/api/v1/student/progress?*", (route) => {
    const id = new URL(route.request().url()).searchParams.get("studentProgramId");
    return route.fulfill({
      json:
        id === "paused"
          ? { totalTopics: 9, topics: { completed: [] } }
          : id === "completed"
            ? { totalTopics: 9, topics: { completed: Array.from({ length: 9 }, (_, i) => ({ id: String(i) })) } }
            : id === "archived"
              ? {}
              : progress,
    });
  });
  await page.goto("/student/programs");
  const current = page.getByRole("region", { name: "Текущая программа", exact: true });
  const other = page.getByRole("region", { name: "Другие программы" });
  const action = current.getByRole("link", { name: "Продолжить обучение" });
  await expect(action).toHaveAttribute("href", "/student/programs/overview-program/topics/topic");
  await expect(other.getByText("Приостановлена", { exact: true })).toBeVisible();
  await expect(other.getByText("Завершена", { exact: true })).toBeVisible();
  await expect(other.getByText("В архиве", { exact: true })).toBeVisible();
  await expect(other.getByText("Текущая тема")).toHaveCount(0);
  for (const width of widths) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const activeBox = await current.getByRole("article").boundingBox();
    const secondaryBox = await other.getByRole("article").first().boundingBox();
    expect(activeBox!.height).toBeGreaterThan(secondaryBox!.height);
    expect(activeBox!.y + activeBox!.height).toBeLessThan(secondaryBox!.y);
    const progressBox = await current.getByRole("progressbar").boundingBox();
    const actionBox = await action.boundingBox();
    if (width >= 1024) {
      expect(actionBox!.x).toBeGreaterThan(progressBox!.x + progressBox!.width);
    } else {
      expect(actionBox!.y).toBeGreaterThan(progressBox!.y + progressBox!.height);
    }
    if (width === 1440 || width === 390) await screenshot(page, `student-programs-long-content-${width}`);
  }
  await action.focus();
  await expect(action).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(other.getByRole("link").first()).toBeFocused();
  expect(await page.locator("main a a, main a button, main button a").count()).toBe(0);

  await page.unroute("**/api/v1/student/programs");
  await page.route("**/api/v1/student/programs", (route) =>
    route.fulfill({ json: [{ ...program, description: null }] }),
  );
  await page.unroute("**/api/v1/student/programs/overview-program");
  await page.route("**/api/v1/student/programs/overview-program", (route) =>
    route.fulfill({ json: { ...details, modules: [] } }),
  );
  await page.unroute("**/api/v1/student/progress?*");
  await page.route("**/api/v1/student/progress?*", (route) => route.fulfill({ json: {} }));
  await page.reload();
  await expect(current.getByRole("link", { name: "Открыть программу" })).toBeVisible();
  await expect(current.getByRole("progressbar")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await screenshot(page, "student-programs-missing-data-390");
});
