import { expect, test, type Cookie, type Page } from "@playwright/test";
import { login } from "./helpers/journeys";

// Reuse real sessions across viewport checks without bypassing authentication or rate limits.
let teacherCookies: Cookie[];
let studentCookies: Cookie[];
test.beforeAll(async ({ browser }) => {
  for (const role of ["teacher", "student"] as const) {
    const context = await browser.newContext({ baseURL: test.info().project.use.baseURL });
    const page = await context.newPage();
    await login(page, role, `/${role}`);
    const cookies = await context.cookies();
    if (role === "teacher") teacherCookies = cookies;
    else studentCookies = cookies;
    await context.close();
  }
});

async function capture(page: Page, name: string, path: (name: string) => string) {
  await expect(page.locator("main")).toBeVisible();
  await expect(page.locator("main").getByRole("heading").first()).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(page.viewportSize()!.width);
  await expect(page.locator('main [aria-busy="true"]:visible')).toHaveCount(0);
  await page.screenshot({ path: path(`${name}.png`), fullPage: true });
}

for (const width of [375, 768, 1280, 1440]) {
  test(`demo role workflows share the design system at ${width}px`, async ({ page }, testInfo) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Вход", exact: true })).toBeVisible();
    await capture(page, "login", testInfo.outputPath.bind(testInfo));
    // Validation and keyboard focus remain visible in the compact form.
    await page.getByRole("button", { name: "Войти", exact: true }).click();
    await expect(page.getByLabel("Email", { exact: true })).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByLabel("Email", { exact: true })).toBeFocused();
    await page.screenshot({ path: testInfo.outputPath("login-validation.png"), fullPage: true });

    await page.context().addCookies(teacherCookies);
    await page.goto("/teacher");
    await expect(page.getByRole("region", { name: "Сводка преподавателя" })).toBeVisible();
    await capture(page, "teacher-dashboard", testInfo.outputPath.bind(testInfo));
    await page.goto("/teacher/students");
    await expect(page.getByRole("link", { name: /Алексей Иванов/ })).toBeVisible();
    await capture(page, "teacher-students", testInfo.outputPath.bind(testInfo));
    const alex = page.getByRole("link", { name: /Алексей Иванов/ });
    const studentHref = await alex.getAttribute("href");
    const studentId = studentHref!.split("/")[3];
    await page.goto(studentHref!);
    await expect(page.getByRole("heading", { name: "Алексей Иванов" })).toBeVisible();
    await capture(page, "teacher-student-detail", testInfo.outputPath.bind(testInfo));
    await page.goto("/teacher/programs");
    await expect(page.getByRole("heading", { name: "Ваши программы" })).toBeVisible();
    await capture(page, "teacher-programs", testInfo.outputPath.bind(testInfo));
    await page.getByRole("button", { name: "Создать программу", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Создать программу", exact: true });
    await expect(dialog).toBeVisible();
    const box = await dialog.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width);
    await page.screenshot({ path: testInfo.outputPath("program-dialog.png") });
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(page.getByRole("button", { name: "Создать программу", exact: true })).toBeFocused();
    await page.getByRole("link", { name: "Открыть программу: Python с нуля", exact: true }).click();
    await expect(page).toHaveURL(/\/teacher\/programs\/[^/]+$/);
    await expect(page.getByRole("heading", { name: "Python с нуля", exact: true })).toBeVisible();
    await capture(page, "teacher-program-editor", testInfo.outputPath.bind(testInfo));
    await page.goto("/teacher/tasks");
    await expect(page.getByRole("link", { name: /Сумма/ }).first()).toBeVisible();
    await capture(page, "teacher-tasks", testInfo.outputPath.bind(testInfo));
    await page.goto(`/teacher/students/${studentId}/homework`);
    await expect(page.getByRole("link", { name: /Основы/ }).first()).toBeVisible();
    await capture(page, "teacher-homework", testInfo.outputPath.bind(testInfo));
    await page
      .getByRole("link", { name: /Основы/ })
      .first()
      .click();
    await expect(page).toHaveURL(/\/homework\/[^/]+$/);
    await expect(page.getByRole("heading", { name: /Основы/ }).first()).toBeVisible();
    await capture(page, "teacher-review", testInfo.outputPath.bind(testInfo));
    await page.context().clearCookies();
    await page.context().addCookies(studentCookies);
    await page.goto("/student");
    await expect(page.getByRole("region", { name: "Домашние задания", exact: true })).toBeVisible();
    await capture(page, "student-dashboard", testInfo.outputPath.bind(testInfo));
    await page.goto("/student/programs");
    await expect(page.getByRole("heading", { name: "Мои программы", exact: true })).toBeVisible();
    await capture(page, "student-programs", testInfo.outputPath.bind(testInfo));
    await page
      .getByRole("article", { name: "Python с нуля", exact: true })
      .getByRole("link", { name: "Открыть программу", exact: true })
      .click();
    await expect(page).toHaveURL(/\/student\/programs\/[^/]+$/);
    await expect(page.getByRole("heading", { name: "Python с нуля", exact: true })).toBeVisible();
    await capture(page, "student-program", testInfo.outputPath.bind(testInfo));
    await page
      .getByRole("link", { name: /Переменные/ })
      .first()
      .click();
    await expect(page).toHaveURL(/\/topics\/[^/]+$/);
    await expect(page.getByRole("heading", { name: /Переменные/ }).first()).toBeVisible();
    await capture(page, "student-topic-task", testInfo.outputPath.bind(testInfo));
    await page.getByRole("button", { name: "Решить", exact: true }).first().click();
    await expect(page.locator('section[id$="-solution"]')).toBeVisible();
    await capture(page, "student-task-solution", testInfo.outputPath.bind(testInfo));
    await page.goto("/student/progress");
    await expect(page.getByRole("heading", { name: "Мой прогресс", exact: true })).toBeVisible();
    await capture(page, "student-progress", testInfo.outputPath.bind(testInfo));
  });

  test(`admin controls and public content fit ${width}px`, async ({ page }, testInfo) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width, height: 900 });
    // Admin access fixture exercises only rendering; authorization remains server-owned.
    await page.route("**/api/v1/auth/me", (route) =>
      route.fulfill({
        json: { id: "admin", email: "admin@example.com", displayName: "Администратор", roles: ["ADMIN", "TEACHER"] },
      }),
    );
    await page.route("**/api/v1/admin/settings", (route) =>
      route.fulfill({ json: { registrationMode: "INVITE_ONLY", updatedAt: "2026-10-01T10:00:00Z" } }),
    );
    await page.goto("/admin");
    await capture(page, "admin-dashboard", testInfo.outputPath.bind(testInfo));
    await page.goto("/admin/settings");
    await expect(page.getByRole("radio").first()).toBeVisible();
    await capture(page, "admin-settings", testInfo.outputPath.bind(testInfo));
    await page.getByRole("radio").first().focus();
    expect(
      await page
        .getByRole("radio")
        .first()
        .evaluate((el) => getComputedStyle(el).outlineStyle),
    ).toBe("solid");
    await page.goto("/progress/demo_progress_alex_8wN3fK6qR1xV9mC4sT7yH2pL5zB0aD");
    await expect(page.getByRole("heading", { name: "Основные показатели" })).toBeVisible();
    await capture(page, "public-progress", testInfo.outputPath.bind(testInfo));
    await page.goto("/reports/demo_report_alex_5qT9mV2xH7kR4wC8sN1yL6pB3zF0aJ");
    await expect(page.getByRole("heading", { name: "Результаты периода" })).toBeVisible();
    await capture(page, "public-report", testInfo.outputPath.bind(testInfo));
  });
}

// Browser visual lint for semantic pairs and native keyboard focus, independent of demo records.
test("semantic text and control colors meet contrast requirements", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
  const ratios = await page.evaluate(() => {
    const css = getComputedStyle(document.documentElement);
    const luminance = (token: string) => {
      const probe = document.createElement("span");
      probe.style.color = css.getPropertyValue(`--${token}`).trim() || token;
      document.body.append(probe);
      const channels = getComputedStyle(probe)
        .color.match(/[\d.]+/g)!
        .slice(0, 3)
        .map(Number);
      probe.remove();
      const linear = channels.map((channel) => {
        const value = channel / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      });
      return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
    };
    return [
      ["foreground", "surface", 4.5],
      ["foreground-muted", "surface-subtle", 4.5],
      ["foreground-subtle", "surface-hover", 4.5],
      ["primary", "primary-subtle", 4.5],
      ["primary-foreground", "primary", 4.5],
      ["success", "success-subtle", 4.5],
      ["warning", "warning-subtle", 4.5],
      ["danger", "danger-subtle", 4.5],
      ["primary-foreground", "danger", 4.5],
      ["border-strong", "surface", 3],
      ["focus-ring", "surface", 3],
      ["code-foreground", "code-surface", 4.5],
      ...["login-email", "login-password"].map((id) => {
        const control = getComputedStyle(document.getElementById(id)!);
        return [control.borderColor, control.backgroundColor, 3];
      }),
    ].map(([foreground, background, minimum]) => {
      const values = [luminance(String(foreground)), luminance(String(background))].sort((a, b) => a - b);
      return { foreground, background, minimum: Number(minimum), ratio: (values[1] + 0.05) / (values[0] + 0.05) };
    });
  });
  for (const pair of ratios)
    expect(pair.ratio, `${pair.foreground} on ${pair.background}`).toBeGreaterThanOrEqual(pair.minimum);
  await page.getByLabel("Email", { exact: true }).focus();
  expect(await page.getByLabel("Email", { exact: true }).evaluate((el) => getComputedStyle(el).outlineStyle)).toBe(
    "solid",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await page
      .getByRole("button", { name: "Войти", exact: true })
      .evaluate((el) => getComputedStyle(el).transitionDuration),
  ).toBe("1e-05s");
});

test("loading, failure, retry and empty states stay usable on mobile", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.route("**/api/v1/auth/me", (route) =>
    route.fulfill({
      json: { id: "teacher", email: "fixture@example.com", displayName: "Преподаватель", roles: ["TEACHER"] },
    }),
  );
  await page.route("**/api/v1/teacher/subjects", (route) => route.fulfill({ json: [] }));
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let failed = true;
  await page.route("**/api/v1/teacher/tasks?*", async (route) => {
    await gate;
    if (failed)
      await route.fulfill({ status: 503, json: { code: "SERVICE_UNAVAILABLE", message: "Unavailable", details: [] } });
    else await route.fulfill({ json: { items: [], page: 0, size: 20, totalElements: 0, totalPages: 0 } });
  });
  await page.goto("/teacher/tasks");
  await expect(page.getByText("Загружаем задания…")).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("loading.png"), fullPage: true });
  release();
  await expect(page.locator("main").getByRole("alert")).toContainText("Не удалось загрузить банк заданий.", {
    timeout: 15000,
  });
  await capture(page, "error", testInfo.outputPath.bind(testInfo));
  failed = false;
  await page.getByRole("button", { name: "Повторить" }).click();
  await expect(page.getByText("Задания не найдены")).toBeVisible();
  await capture(page, "empty", testInfo.outputPath.bind(testInfo));
});
