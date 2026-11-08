import { expect, test, type Page, type FrameLocator } from "@playwright/test";
import { createPracticeTask, type PracticeTechnology } from "../src/features/web-practice/model/tasks";

async function start(page: Page, technology: PracticeTechnology = "all") {
  await page.goto("/student/web-practice");
  await page.getByLabel("Технология", { exact: true }).selectOption(technology);
  await page.getByRole("button", { name: "Начать поток", exact: true }).click();
}

async function taskOnPage(page: Page) {
  const id = await page.getByRole("region", { name: "Рабочая область вёрстки" }).getAttribute("data-task-id");
  const [technology, seed, position] = id!.split(":");
  return createPracticeTask(technology as PracticeTechnology, Number(seed), Number(position));
}

async function edit(page: Page, name: string, source: string) {
  await page.getByRole("tab", { name, exact: true }).click();
  const lines = page.getByRole("tabpanel").locator(".monaco-editor .view-lines");
  await expect(lines).toBeVisible();
  await lines.click({ position: { x: 20, y: 12 } });
  await page.keyboard.press("ControlOrMeta+A");
  // Exercise paste without replacing the user's system clipboard. Monaco treats native
  // insertText as typing and may indent a whole HTML document once per newline.
  await page.evaluate((text) => {
    const clipboardData = new DataTransfer();
    clipboardData.setData("text/plain", text);
    document.activeElement!.dispatchEvent(
      new ClipboardEvent("paste", { clipboardData, bubbles: true, cancelable: true }),
    );
  }, source);
}

async function sourceInEditor(page: Page, language: string) {
  return page.evaluate((name) => {
    const monaco = (
      window as Window & {
        monaco?: { editor: { getModels: () => { getLanguageId: () => string; getValue: () => string }[] } };
      }
    ).monaco;
    return monaco?.editor
      .getModels()
      .find((model) => model.getLanguageId() === name)
      ?.getValue();
  }, language);
}

function preview(page: Page) {
  return page.getByRole("region", { name: "Предпросмотр решения", exact: true }).frameLocator("iframe");
}

async function verifyBehavior(frame: FrameLocator, javascript: string) {
  if (javascript.includes("selected")) {
    const increment = Number(javascript.match(/selected \+= (\d+)/)![1]);
    await frame.getByRole("button", { name: "Добавить", exact: true }).first().click();
    await frame.getByRole("button", { name: "Добавить", exact: true }).last().click();
    await expect(frame.locator("#total")).toHaveText(String(2 * increment));
  } else if (javascript.includes("search")) {
    await frame.getByRole("searchbox").fill("АДАПТИВНАЯ");
    await expect(frame.locator(".card:visible")).toHaveCount(1);
    await frame.getByRole("searchbox").fill("");
    await expect(frame.locator(".card:visible")).toHaveCount(3);
  } else {
    await frame.getByRole("button", { name: "Тёмная тема" }).click();
    await expect(frame.locator("body")).toHaveClass("dark");
    await expect(frame.getByRole("button", { name: "Тёмная тема" })).toHaveAttribute("aria-pressed", "true");
    await frame.getByRole("button", { name: "Тёмная тема" }).click();
    await expect(frame.locator("body")).not.toHaveClass("dark");
  }
}

test.beforeEach(async ({ page }) => {
  await page.route("**/api/v1/**", (route) => {
    if (new URL(route.request().url()).pathname.endsWith("/auth/me"))
      return route.fulfill({
        json: {
          id: "practice-student",
          email: "practice@test.local",
          displayName: "Ученик",
          roles: ["STUDENT"],
        },
      });
    return route.fulfill({ status: 404, json: {} });
  });
});

test("VS Code-style files preserve edits and undo; a project runs explicitly and the next task starts clean", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await start(page);
  const task = await taskOnPage(page);
  await expect(page.getByRole("navigation", { name: "Проводник файлов" })).toBeVisible();
  await edit(page, "index.html", task.solution.html);
  await edit(page, "styles.css", task.solution.css);
  await page.getByRole("tab", { name: "index.html", exact: true }).click();
  const lines = page.getByRole("tabpanel").locator(".view-lines");
  await expect.poll(() => sourceInEditor(page, "html")).toBe(task.solution.html);
  await lines.click();
  await page.keyboard.press("ControlOrMeta+Z");
  await expect.poll(() => sourceInEditor(page, "html")).toBe(task.starter.html);
  await page.keyboard.press("ControlOrMeta+Shift+Z");
  await expect.poll(() => sourceInEditor(page, "html")).toBe(task.solution.html);
  await edit(page, "script.js", task.solution.javascript);
  await page.getByRole("button", { name: "Результат", exact: true }).click();
  await expect(preview(page).locator(".card")).toHaveCount(0);
  await page.getByRole("button", { name: "Запустить · Ctrl/⌘+Enter", exact: true }).click();
  await expect(preview(page).locator(".card")).toHaveCount(3);
  await verifyBehavior(preview(page), task.solution.javascript);
  await edit(page, "script.js", task.solution.javascript + '\nconsole.log("Fresh run");');
  await page.keyboard.press("ControlOrMeta+Enter");
  await expect(page.getByText("log: Fresh run", { exact: true })).toBeVisible();
  await verifyBehavior(preview(page), task.solution.javascript);
  await expect(
    page.getByRole("region", { name: "Предпросмотр решения", exact: true }).locator("iframe"),
  ).toHaveAttribute("sandbox", "allow-scripts");
  await page.screenshot({ path: "/tmp/web-practice-workspace.png", fullPage: true });
  await page.getByRole("button", { name: "Условие", exact: true }).click();
  for (const checkbox of await page.getByRole("checkbox").all()) await checkbox.check();
  await page.getByRole("button", { name: "Я проверил — следующее задание", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Задание 2");
  await expect.poll(() => sourceInEditor(page, "html")).toBe((await taskOnPage(page)).starter.html);
  await expect(page.getByRole("button", { name: "Я проверил — следующее задание" })).toBeDisabled();
});

test("all three generated page families have working responsive references", async ({ page }) => {
  await start(page, "javascript");
  for (let index = 0; index < 3; index++) {
    const task = await taskOnPage(page);
    await page.getByRole("button", { name: "Образец", exact: true }).click();
    await expect(preview(page).locator(".card")).toHaveCount(3);
    await verifyBehavior(preview(page), task.solution.javascript);
    await page
      .getByRole("region", { name: "Предпросмотр решения" })
      .getByLabel("Ширина предпросмотра")
      .selectOption("375px");
    const columns = await preview(page)
      .locator(".grid")
      .evaluate((grid) => getComputedStyle(grid).gridTemplateColumns.split(" ").length);
    expect(columns).toBe(1);
    await expect(page.getByRole("region", { name: "Предпросмотр решения" })).not.toContainText("error:");
    if (index < 2) {
      await page.getByRole("button", { name: "Пропустить", exact: true }).click();
      await page.getByRole("button", { name: "Перейти к следующему", exact: true }).click();
    }
  }
});

test("CSS-only practice locks supplied files and the mobile workspace does not overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await start(page, "css");
  await expect(page.getByRole("tab", { name: /styles.css/ })).toHaveAttribute("aria-selected", "true");
  await edit(page, "styles.css", ".card { color: rgb(12, 34, 56); }");
  await page.getByRole("tab", { name: /index.html/ }).click();
  const lines = page.getByRole("tabpanel").locator(".view-lines");
  await expect(lines).toContainText("<h1>");
  await lines.click();
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.insertText("REPLACE LOCKED FILE");
  await expect(lines).not.toContainText("REPLACE LOCKED FILE");
  await page.getByRole("button", { name: "Запустить · Ctrl/⌘+Enter", exact: true }).click();
  await expect(preview(page).locator(".card").first()).toHaveCSS("color", "rgb(12, 34, 56)");
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await page.screenshot({ path: "/tmp/web-practice-mobile.png", fullPage: true });
});

test("the gray-sample practice continues to a fresh task with reset statistics", async ({ page }) => {
  await page.goto("/student/web-practice");
  await page.getByLabel("Технология", { exact: true }).selectOption("javascript");
  await page.getByRole("radio", { name: /^Набор по серому образцу/ }).check();
  await page.getByRole("button", { name: "Начать поток", exact: true }).click();
  // Read the deterministic variant from its title/step sample without changing input behavior.
  const input = page.getByRole("textbox");
  while (await input.count()) {
    const sample = (await page.locator("#typing-sample").textContent())!.replace("Образец текущего шага: ", "");
    for (const character of sample) {
      if (character === "\n") await input.press("Enter");
      else await input.pressSequentially(character);
    }
  }
  await page.getByRole("button", { name: "Следующее задание", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Задание 2" })).toBeVisible();
  await expect(page.getByRole("textbox")).toHaveValue("");
  await expect(page.getByText("100%", { exact: true })).toBeVisible();
  await expect(page.getByText("0:00", { exact: true })).toBeVisible();
});
