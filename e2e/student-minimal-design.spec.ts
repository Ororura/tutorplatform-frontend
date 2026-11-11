import { expect, test } from "@playwright/test";

const base = {
  studentProgramId: "web",
  status: "ASSIGNED",
  assignedAt: "2026-11-01T10:00:00Z",
  dueAt: null,
  overdue: false,
  itemsCount: 3,
  createdAt: "2026-11-01T10:00:00Z",
};
const assignments = [
  { ...base, id: "portfolio", title: "Адаптивная страница портфолио" },
  { ...base, id: "loops", title: "Циклы и условия", studentProgramId: "python" },
  { ...base, id: "dom", title: "Работа с DOM" },
];
for (const width of [1440, 390]) {
  test(`minimal homework navigation and status tabs at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.route("**/api/v1/**", (route) => {
      const url = new URL(route.request().url());
      if (url.pathname.endsWith("/auth/me"))
        return route.fulfill({
          json: { id: "student", displayName: "Александр", email: "student@test.local", roles: ["STUDENT"] },
        });
      if (url.pathname.endsWith("/student/programs"))
        return route.fulfill({
          json: [
            { id: "web", title: "HTML и CSS" },
            { id: "python", title: "Python" },
          ],
        });
      if (url.pathname.endsWith("/student/homeworks")) {
        const items =
          url.searchParams.get("status") === "ASSIGNED"
            ? assignments
            : url.searchParams.get("status") === "COMPLETED"
              ? [{ ...base, id: "done", title: "Основы HTML", status: "COMPLETED" }]
              : [];
        return route.fulfill({ json: { items, page: 0, size: 20, totalPages: 1, totalElements: items.length } });
      }
      const homework = assignments.find((item) => url.pathname.endsWith(`/${item.id}`));
      if (homework)
        return route.fulfill({
          json: {
            ...homework,
            items: [
              {
                id: "task",
                required: true,
                passed: false,
                latestSubmissionStatus: homework.id === "dom" ? "NEEDS_REVIEW" : null,
              },
            ],
          },
        });
      return route.fulfill({ status: 404, json: {} });
    });
    await page.goto("/student/homework");
    await expect(page.getByRole("heading", { name: "Задания", exact: true })).toBeVisible();
    await expect(page.getByRole("article")).toHaveCount(2);
    await expect(page.getByRole("link", { name: "Продолжить: Адаптивная страница портфолио" })).toHaveAttribute(
      "href",
      "/student/homework/portfolio",
    );
    await page.screenshot({ path: `/tmp/student-minimal-${width}.png`, fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole("tab", { name: "В работе", exact: true }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("tab", { name: "На проверке", exact: true })).toBeFocused();
    await expect(page.getByRole("article")).toHaveCount(1);
    await expect(page.getByRole("article")).toHaveAccessibleName("Работа с DOM");
    await page.getByRole("tab", { name: "Завершённые", exact: true }).click();
    await expect(page.getByRole("article")).toHaveAccessibleName("Основы HTML");
    if (width < 1280) await page.getByRole("button", { name: "Открыть меню" }).click();
    const nav = page.getByRole("navigation", {
      name: width < 1280 ? "Мобильная навигация ученика" : "Навигация ученика",
      exact: true,
    });
    await expect(nav.getByRole("link", { name: "Задания", exact: true })).toHaveAttribute("aria-current", "page");
    await expect(nav.getByRole("link", { name: "Практика", exact: true })).toHaveAttribute(
      "href",
      "/student/web-practice",
    );
    if (width < 1280) {
      await page.keyboard.press("Escape");
      await expect(page.getByRole("button", { name: "Открыть меню" })).toBeFocused();
    } else {
      await page.locator("summary").click();
      await expect(page.getByRole("button", { name: "Выйти", exact: true })).toBeVisible();
    }
  });
}
