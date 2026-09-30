import { expect, test, type Page } from "@playwright/test";

const studentEmail = "alex.demo@tutor.local";
const studentPassword = "DemoStudent123!";

function assertLocalTestEnvironment(page: Page) {
  const hostname = new URL(page.url()).hostname;
  expect(["localhost", "127.0.0.1", "::1"], "E2E mutations are allowed only on a local test environment").toContain(
    hostname,
  );
}

test("demo student completes the learning journey", async ({ page }) => {
  test.setTimeout(120_000);

  await page.goto("/login?next=%2Fstudent");
  assertLocalTestEnvironment(page);
  await page.getByLabel("Email", { exact: true }).fill(studentEmail);
  await page.getByLabel("Пароль", { exact: true }).fill(studentPassword);
  await page.getByRole("button", { name: "Войти" }).click();

  await expect(page).toHaveURL(/\/student$/);
  await expect(page.getByRole("heading", { name: "Добрый день, Алексей!" })).toBeVisible();

  const homeworkOverview = page.getByRole("region", { name: "Домашние задания", exact: true });
  const programOverview = page.getByRole("region", { name: "Моя программа", exact: true });
  await expect(homeworkOverview.getByRole("link", { name: "Все задания" })).toBeVisible();
  await expect(programOverview.getByRole("link", { name: "Все программы" })).toBeVisible();
  await expect(homeworkOverview.getByRole("article").first().getByRole("progressbar")).toBeVisible();
  await expect(programOverview.getByRole("progressbar").first()).toBeVisible();
  await expect(page.getByText("Быстрые действия")).toHaveCount(0);

  const mascot = page.locator("main header img");

  for (const width of [1536, 1440, 1280, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await expect(homeworkOverview).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const homeworkBox = await homeworkOverview.boundingBox();
    const programBox = await programOverview.boundingBox();
    expect(homeworkBox).not.toBeNull();
    expect(programBox).not.toBeNull();
    if (width >= 1280) {
      await expect(mascot).toBeVisible();
      await expect.poll(() => mascot.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
      expect(homeworkBox!.width / programBox!.width).toBeGreaterThan(1.7);
      expect(homeworkBox!.width / programBox!.width).toBeLessThan(1.9);
    } else {
      await expect(mascot).toBeHidden();
      expect(homeworkBox!.y + homeworkBox!.height).toBeLessThan(programBox!.y);
    }
    if (width === 1440 || width === 390) {
      const path = test.info().outputPath(`student-dashboard-${width}.png`);
      await page.screenshot({ path, fullPage: true });
      await test.info().attach(`student-dashboard-${width}`, { path, contentType: "image/png" });
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });

  await page.getByRole("link", { name: "Мои программы", exact: true }).click();
  await expect(page).toHaveURL(/\/student\/programs$/);
  await expect(page.getByRole("heading", { name: /^Текущ(ая программа|ие программы)$/ })).toBeVisible();

  const assignedProgram = page.getByRole("article").filter({
    has: page.getByRole("heading", { name: "Python с нуля", exact: true }),
  });
  const programAction = assignedProgram.getByRole("link", { name: /Открыть программу|Продолжить обучение/ });
  const programHref = (await programAction.getAttribute("href"))!.split("/topics/")[0];
  await programAction.click();
  // Continue may open a current topic directly; still exercise the full program contents below.
  await page.goto(programHref);
  await expect(page).toHaveURL(/\/student\/programs\/[^/]+$/);
  await expect(page.getByRole("heading", { name: "Python с нуля", exact: true })).toBeVisible();

  const programModule = page.getByRole("listitem").filter({
    has: page.getByRole("heading", { name: "Управление программой", exact: true }),
  });
  await expect(programModule).toBeVisible();
  await programModule.getByRole("link", { name: /Циклы for/ }).click();

  await expect(page).toHaveURL(/\/student\/programs\/[^/]+\/topics\/[^/]+$/);
  await expect(page.getByRole("heading", { name: "Циклы for", exact: true })).toBeVisible();

  const materials = page.getByRole("region", { name: "Учебные материалы" });
  await expect(materials.getByRole("heading", { name: "Основные правила работы с циклами" })).toBeVisible();
  await expect(materials).toContainText("Используйте for для обхода последовательностей");

  const codeTask = page.getByRole("listitem").filter({
    has: page.getByRole("heading", { name: "Выведи Hello, World!", exact: true }),
  });
  await expect(codeTask.getByText("Код", { exact: true })).toBeVisible();
  await codeTask.getByRole("button", { name: "Решить" }).click();

  await page.getByLabel("Код решения").fill('print("Hello, World!")');
  await page.getByRole("button", { name: "Отправить решение" }).click();

  const submissionResult = page.getByRole("region", { name: "Результат отправки" });
  await expect(submissionResult.getByText("Выполнено", { exact: true })).toBeVisible({ timeout: 60_000 });
  await expect(submissionResult.getByText("Решение принято", { exact: true })).toBeVisible();
  await expect(submissionResult).toContainText("Тесты: 2 из 2");

  await page.getByRole("link", { name: "Домашние задания", exact: true }).click();
  await expect(page).toHaveURL(/\/student\/homework$/);
  await expect(page.getByRole("heading", { name: "Домашние задания", level: 1 })).toBeVisible();
});
