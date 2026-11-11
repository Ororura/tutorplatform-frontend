import { expect, test } from "@playwright/test";

for (const { width, height } of [
  { width: 1440, height: 900 },
  { width: 1280, height: 800 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
]) {
  test(`tasks and student workspace fit ${width}px and support keyboard navigation`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    let role = "TEACHER";
    await page.route("**/api/v1/auth/me", (route) =>
      route.fulfill({ json: { id: "user", email: "review@example.com", displayName: "Анна Смирнова", roles: [role] } }),
    );
    await page.route("**/api/v1/teacher/subjects", (route) =>
      route.fulfill({ json: [{ id: "python", name: "Программирование".repeat(12), status: "ACTIVE" }] }),
    );
    await page.route("**/api/v1/teacher/tasks?*", (route) =>
      route.fulfill({
        json: {
          items: [
            {
              id: "task",
              subjectId: "python",
              title: "НазваниеЗадания".repeat(15),
              taskType: "TEXT",
              difficulty: "EASY",
              status: "DRAFT",
            },
          ],
          page: 0,
          size: 20,
          totalElements: 21,
          totalPages: 2,
        },
      }),
    );
    await page.goto("/teacher/tasks");
    await expect(page.getByRole("link", { name: /НазваниеЗадания/ })).toBeVisible();
    const sidebar = page.locator('aside[aria-label="Боковая панель"]');
    if (width >= 1280) await expect(sidebar).toBeVisible();
    else await expect(sidebar).toBeHidden();
    await page.getByLabel("Статус", { exact: true }).selectOption("DRAFT");
    await expect(page).toHaveURL(/status=DRAFT/);
    await page.getByRole("button", { name: "Вперёд" }).focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/page=1/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);

    role = "STUDENT";
    await page.route("**/api/v1/student/programs", (route) =>
      route.fulfill({
        json: [
          {
            id: "program",
            title: "ПрограммаОбучения".repeat(12),
            subject: { id: "python", name: "Python" },
            status: "ACTIVE",
            startedAt: "2026-09-27T10:00:00Z",
          },
        ],
      }),
    );
    await page.route("**/api/v1/student/homeworks?*", (route) =>
      route.fulfill({ json: { items: [], page: 0, size: 20, totalElements: 0, totalPages: 0 } }),
    );
    // Program cards load progress and details after keyboard navigation too.
    await page.route("**/api/v1/student/progress?*", (route) =>
      route.fulfill({ json: { totalTopics: 0, topics: { completed: [] } } }),
    );
    await page.route("**/api/v1/student/programs/program", (route) =>
      route.fulfill({
        json: {
          id: "program",
          title: "ПрограммаОбучения".repeat(12),
          subject: { id: "python", name: "Python" },
          status: "ACTIVE",
          modules: [],
        },
      }),
    );
    await page.goto("/student");
    await expect(page.getByText("Невыполненных заданий нет")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    const brand = page.getByRole("link", { name: "Tutor Platform — главная" });
    if (width < 1280) {
      const menu = page.getByRole("button", { name: "Открыть меню" });
      await menu.focus();
      await page.keyboard.press("Enter");
    } else {
      await brand.focus();
      await page.keyboard.press("Tab");
    }
    const mainNavigation = page.getByRole("navigation", {
      name: width >= 1280 ? "Навигация ученика" : "Мобильная навигация ученика",
      exact: true,
    });
    const home = mainNavigation.getByRole("link", { name: "Программы", exact: true });

    await expect(home).toBeFocused();
    expect(await home.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe("solid");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/student\/programs$/);
    await expect(page.getByRole("heading", { name: "Мои программы", exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  });
}
