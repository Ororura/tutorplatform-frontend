import { expect, test, type Page } from "@playwright/test";

import type { StudentHomeworkPage, StudentHomeworkSummary } from "../src/entities/homework";

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

test("real homework prioritizes action and shares dashboard styling at all requested widths", async ({ page }) => {
  test.setTimeout(90_000);
  await login(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(
    page.getByRole("region", { name: "Домашние задания", exact: true }).getByRole("article").first(),
  ).toBeVisible();
  await expect(
    page
      .getByRole("region", { name: "Домашние задания", exact: true })
      .getByRole("article")
      .first()
      .getByRole("progressbar"),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Моя программа", exact: true }).getByRole("progressbar").first(),
  ).toBeVisible();
  await screenshot(page, "student-dashboard-real-1440");
  await page.getByRole("link", { name: "Все задания", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Задания" })).toBeVisible();
  const panel = page.getByRole("tabpanel");
  await expect(panel.getByRole("article").first()).toBeVisible();
  for (const width of widths) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width === 1440 || width === 390) await screenshot(page, `student-homework-real-${width}`);
  }
  await page.getByRole("tab", { name: "Завершённые", exact: true }).click();
  await expect(panel.getByText("Выполнено", { exact: true }).first()).toBeVisible();
  await expect(panel.getByText("Отменено", { exact: true }).first()).toBeVisible();
  await panel.getByRole("link").first().click();
  await expect(page).toHaveURL(/\/student\/homework\/[^/]+$/);
});

const base: StudentHomeworkSummary = {
  id: "long-homework",
  studentProgramId: "missing-program",
  title: "Практическое задание по обработке коллекций и написанию функций с очень подробными требованиями",
  status: "ASSIGNED",
  assignedAt: "2026-09-01T10:00:00Z",
  dueAt: "2020-09-24T15:00:00Z",
  overdue: false,
  itemsCount: 11,
  createdAt: "2026-09-01T10:00:00Z",
};
function homeworkPage(items: StudentHomeworkSummary[], page = 0, totalPages = 1): StudentHomeworkPage {
  return { items, page, size: items.length, totalPages, totalElements: totalPages * items.length };
}

test("server pagination, compact history and missing optional metadata remain usable", async ({ page }) => {
  test.setTimeout(90_000);
  await login(page);
  await page.route("**/api/v1/student/programs", (route) => route.fulfill({ json: [] }));
  await page.route("**/api/v1/student/homeworks/*", (route) =>
    route.fulfill({ json: { ...base, id: route.request().url().split("/").at(-1), items: [] } }),
  );
  const requests: string[] = [];
  await page.route("**/api/v1/student/homeworks?*", (route) => {
    const params = new URL(route.request().url()).searchParams;
    const status = params.get("status")!;
    const index = Number(params.get("page"));
    requests.push(`${status}:${index}`);
    const items =
      status === "ASSIGNED"
        ? index === 0
          ? [base, { ...base, id: "no-deadline", title: "Работа без срока", dueAt: null, overdue: true }]
          : [{ ...base, id: "next-active", title: "Следующая актуальная работа" }]
        : Array.from({ length: 3 }, (_, i): StudentHomeworkSummary => ({
            ...base,
            id: `${status}-${index}-${i}`,
            title: `Историческая работа ${status} ${index} ${i}`,
            status: status as "COMPLETED" | "CANCELLED",
            assignedAt: `2026-09-${20 - index * 3 - i}T10:00:00Z`,
          }));
    return route.fulfill({ json: homeworkPage(items, index, 2) });
  });
  await page.goto("/student/homework");
  const panel = page.getByRole("tabpanel");
  await expect(panel.getByText(/11 заданий/).first()).toBeVisible();
  await expect(panel.getByText(/Срок был 24 сентября 2020/).first()).toBeVisible();
  await page.getByRole("button", { name: "Загрузить ещё задания" }).click();
  await expect(panel.getByRole("heading", { name: "Следующая актуальная работа" })).toBeVisible();
  await page.getByRole("tab", { name: "Завершённые", exact: true }).click();
  await expect(panel.getByRole("listitem")).toHaveCount(6);
  await page.getByRole("button", { name: "Загрузить ещё задания" }).click();
  await expect(panel.getByRole("listitem")).toHaveCount(12);
  expect(requests).toContain("ASSIGNED:1");
  expect(requests).toContain("COMPLETED:1");
  expect(requests).toContain("CANCELLED:1");
  for (const width of widths) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test("empty and failed responses preserve empty-state and retry semantics", async ({ page }) => {
  await login(page);
  let failed = true;
  await page.route("**/api/v1/student/homeworks?*", (route) =>
    failed
      ? route.fulfill({ status: 500, json: { message: "Unavailable" } })
      : route.fulfill({ json: homeworkPage([]) }),
  );
  await page.goto("/student/homework");
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Не удалось загрузить часть заданий.");
  await expect(page.getByText("Заданий в работе пока нет")).toHaveCount(0);
  failed = false;
  await page.getByRole("button", { name: "Повторить" }).click();
  await expect(page.getByRole("heading", { name: "Заданий в работе пока нет" })).toBeVisible();
  await expect(page.getByRole("main").getByRole("region")).toHaveCount(0);
});
