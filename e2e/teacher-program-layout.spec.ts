import { expect, test, type Locator, type Page } from "@playwright/test";

import type { LearningProgramDetails } from "../src/entities/learning-program";

const longTitle = "Данные, переменные и операторы: последовательное изучение основ программирования на Python";
const program: LearningProgramDetails = {
  id: "layout-program",
  slug: "layout-program",
  title: "Python с нуля",
  subject: { id: "python", name: "Python" },
  description: "Изучаем Python на примерах и практических задачах.",
  status: "ACTIVE",
  version: 1,
  createdAt: "2026-09-27T00:00:00Z",
  updatedAt: "2026-09-27T00:00:00Z",
  editable: true,
  hasAssignments: false,
  modules: Array.from({ length: 15 }, (_, index) => ({
    id: `module-${index}`,
    title: index === 0 ? longTitle : `Практика Python: раздел ${index + 1}`,
    description: "Теория, примеры и самостоятельная работа",
    position: index,
    topics: Array.from({ length: 8 }, (_, topicIndex) => ({
      id: `topic-${index}-${topicIndex}`,
      slug: `topic-${index}-${topicIndex}`,
      title: topicIndex === 0 ? longTitle : `Практическая тема ${topicIndex + 1}`,
      description: topicIndex === 0 ? "ДлинноеСловоБезПробелов".repeat(8) : "Разбираем примеры и закрепляем знания",
      position: topicIndex,
      status: "ACTIVE" as const,
      version: 1,
    })),
  })),
};

async function fitsViewport(page: Page, locator: Locator) {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    page.viewportSize()!.width,
  );
}

for (const viewport of [
  { width: 1440, height: 1000 },
  { width: 768, height: 1024 },
  { width: 375, height: 812 },
]) {
  test(`program and materials remain usable at ${viewport.width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.route("**/api/v1/auth/me", (route) =>
      route.fulfill({
        json: {
          id: "teacher",
          email: "teacher@example.com",
          displayName: "Преподаватель",
          roles: ["TEACHER"],
        },
      }),
    );
    await page.route("**/api/v1/teacher/programs/by-slug/layout-program", (route) => route.fulfill({ json: program }));
    await page.route("**/api/v1/teacher/topics/topic-0-0/materials", (route) =>
      route.fulfill({
        json: [
          {
            id: "theory",
            topicId: "topic-0-0",
            title: longTitle,
            materialType: "MARKDOWN",
            content: "## Переменные\n\nСохраняем значения и используем их в программе.",
            position: 0,
            version: 1,
          },
          {
            id: "code",
            topicId: "topic-0-0",
            title: "Пример кода",
            materialType: "CODE_EXAMPLE",
            content: "message = 'Hello, Python!'\nprint(message)",
            position: 1,
            version: 1,
          },
        ],
      }),
    );
    await page.route("**/api/v1/teacher/topics/topic-0-0/tasks", (route) => route.fulfill({ json: [] }));
    await page.route("**/api/v1/teacher/tasks?*", (route) => route.fulfill({ json: { items: [], totalPages: 0 } }));
    await page.goto("/teacher/programs/layout-program");
    const modules = page.getByRole("region", { name: "Модули программы" });
    const firstModule = modules.locator(":scope > ol > li").first();
    await expect(modules.locator(":scope > ol > li")).toHaveCount(15);
    await firstModule.locator("summary").focus();
    await page.keyboard.press("Enter");
    await expect(firstModule.getByRole("link", { name: longTitle })).toBeVisible();

    const trigger = firstModule.getByRole("button", { name: `Действия модуля «${longTitle}»` });
    await fitsViewport(page, trigger);
    await trigger.focus();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("menuitem", { name: "Переместить вниз" })).toBeFocused();
    await fitsViewport(page, page.getByRole("menu"));
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
    await page.screenshot({ path: testInfo.outputPath("program.png") });

    await modules.getByRole("button", { name: "Выбрать темы" }).click();
    const toolbar = page.getByRole("region", { name: "Выбор тем" });
    await toolbar.getByRole("button", { name: "Выбрать все", exact: true }).click();
    await expect(toolbar.getByText("Выбрано: 120")).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, 1100));
    await fitsViewport(page, toolbar);
    const header = await page.locator("header").boundingBox();
    const toolbarBox = await toolbar.boundingBox();
    expect(toolbarBox!.y).toBeGreaterThanOrEqual(header!.y + header!.height);
    expect(toolbarBox!.y + toolbarBox!.height).toBeLessThan(viewport.height);
    await expect(page.getByRole("button", { name: /^Действия (модуля|темы)/ })).toHaveCount(0);
    await page.screenshot({ path: testInfo.outputPath("bulk-selection.png") });
    await toolbar.getByRole("button", { name: "Отменить выбор" }).click();
    await firstModule.getByRole("link", { name: longTitle }).click();

    const material = page.getByRole("region", { name: "Материалы" }).locator(":scope > ol > li").first();
    await expect(material.getByRole("heading", { name: "Переменные", exact: true })).toBeVisible();
    const materialTrigger = material.getByRole("button", { name: `Действия материала «${longTitle}»` });
    await fitsViewport(page, materialTrigger);
    await materialTrigger.click();
    await fitsViewport(page, page.getByRole("menu"));
    await page.keyboard.press("End");
    await expect(page.getByRole("menuitem", { name: "Удалить" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("menu")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Действия материала «Пример кода»" })).toBeFocused();
    await page.screenshot({ path: testInfo.outputPath("materials.png") });
  });
}
