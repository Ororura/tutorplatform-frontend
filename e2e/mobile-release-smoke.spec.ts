import { expect, test } from "@playwright/test";

import { expectMobileLayout, login } from "./helpers/journeys";

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

test("mobile student login, dashboard, program, homework detail and topic are usable", async ({ page }) => {
  await page.goto("/login?next=%2Fstudent");
  await expectMobileLayout(page, page.getByRole("button", { name: "Войти", exact: true }));
  await login(page, "student");
  await expect(page.getByRole("heading", { name: "Добрый день, Алексей!" })).toBeVisible();
  await expectMobileLayout(
    page,
    page.getByRole("region", { name: "Домашние задания", exact: true }).getByRole("link", { name: "Все задания" }),
  );
  await page.getByRole("link", { name: "Мои программы", exact: true }).click();
  const program = page
    .getByRole("article")
    .filter({ has: page.getByRole("heading", { name: "Python с нуля", exact: true }) });
  const action = program.getByRole("link", { name: /Открыть программу|Продолжить обучение/ });
  await expectMobileLayout(page, action);
  const programPath = (await action.getAttribute("href"))!.split("/topics/")[0];
  await action.click();
  await page.goto(programPath);
  await expect(page.getByRole("heading", { name: "Python с нуля", exact: true })).toBeVisible();
  const topic = page.getByRole("link", { name: /Циклы for/ });
  await expectMobileLayout(page, topic);
  await topic.click();
  await expect(page.getByRole("heading", { name: "Циклы for", exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "Учебные материалы" })).toContainText(
    "Основные правила работы с циклами",
  );
  const practice = page
    .getByRole("listitem")
    .filter({ has: page.getByRole("heading", { name: "Выведи Hello, World!", exact: true }) })
    .getByRole("button", { name: "Решить" });
  await expectMobileLayout(page, practice);
  await practice.click();
  await expectMobileLayout(page, page.getByRole("button", { name: "Запустить", exact: true }));

  await page.getByRole("link", { name: "Домашние задания", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Домашние задания", level: 1 })).toBeVisible();
  const homework = page.getByRole("link", { name: "Открыть: Циклы", exact: true });
  await expectMobileLayout(page, homework);
  await homework.click();
  await expect(page.getByRole("heading", { name: "Циклы", exact: true })).toBeVisible();
  const taskAction = page.getByRole("button", { name: /^Открыть:/ }).first();
  await expectMobileLayout(page, taskAction);
  await taskAction.click();
  await expectMobileLayout(page, page.getByRole("region", { name: "Прогресс работы" }));
});
