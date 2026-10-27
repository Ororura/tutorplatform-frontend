import { expect, test, type Locator, type Page } from "@playwright/test";
import { typingExercises } from "../src/features/code-typing/model/exercises";

const preview = (page: Page) => page.frameLocator('iframe[title="Результат HTML, CSS и JavaScript"]');

async function typeFragment(input: Locator, text: string) {
  await input.focus();
  // Exercise native keyboard/input handling, including Enter and manually typed spaces.
  for (const character of text) {
    if (character === "\n") await input.press("Enter");
    else await input.pressSequentially(character);
  }
}

test.beforeEach(async ({ page }) => {
  await page.route("**/api/v1/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/auth/me"))
      return route.fulfill({
        json: {
          id: "typing-student",
          email: "typing@test.local",
          displayName: "Ученик",
          roles: ["STUDENT"],
        },
      });
    return route.fulfill({ status: 404, json: { code: "NOT_FOUND" } });
  });
  await page.goto("/student/code-typing");
});

test("CSS applies only at step boundaries; keyboard correction, pause, completion and repeat work", async ({
  page,
}) => {
  const exercise = typingExercises[0];
  await page.getByRole("button", { name: `Начать: ${exercise.title}` }).click();
  const input = page.getByRole("textbox");
  const button = () => preview(page).getByRole("button", { name: "Нажми меня" });
  await expect(button()).not.toHaveCSS("background-color", "rgb(37, 99, 235)");
  await typeFragment(input, "x");
  await expect(input).toHaveValue("x");
  await input.pressSequentially("b");
  await expect(input).toHaveValue("x");
  await input.press("Backspace");
  await typeFragment(input, exercise.steps[0].text.slice(0, -1));
  await expect(button()).not.toHaveCSS("background-color", "rgb(37, 99, 235)");
  await input.press("Tab");
  await expect(input).not.toBeFocused();
  await expect(page.getByRole("status").filter({ hasText: "Пауза" })).toBeVisible();
  await typeFragment(input, ";");
  await expect(button()).toHaveCSS("background-color", "rgb(37, 99, 235)");
  await expect(button()).not.toHaveCSS("color", "rgb(255, 255, 255)");
  for (const step of exercise.steps.slice(1)) await typeFragment(input, step.text);
  await expect(page.getByRole("heading", { name: "Упражнение завершено!" })).toBeFocused();
  await expect(button()).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect(button()).toHaveCSS("padding", "12px 24px");
  await expect(button()).toHaveCSS("border-radius", "8px");
  await expect(page.getByRole("region", { name: "Итог упражнения" })).toContainText("Ошибок: 1");
  await page.screenshot({ path: "/tmp/code-typing-css-complete.png", fullPage: true });
  await page.getByRole("button", { name: "Повторить", exact: true }).click();
  await expect(page.getByRole("textbox")).toHaveValue("");
  await expect(page.getByText("0 / 4", { exact: true })).toBeVisible();
  await expect(button()).not.toHaveCSS("background-color", "rgb(37, 99, 235)");
});

test("JavaScript executes only complete fragments and rebuilds with exactly one click handler", async ({ page }) => {
  const exercise = typingExercises.find((item) => item.id === "js-counter")!;
  await page.getByRole("button", { name: `Начать: ${exercise.title}` }).click();
  const input = page.getByRole("textbox");
  for (const step of exercise.steps.slice(0, 3)) await typeFragment(input, step.text);
  await typeFragment(input, exercise.steps[3].text.slice(0, -1));
  await preview(page).getByRole("button").click();
  await expect(preview(page).locator("#count")).toHaveText("0");
  await typeFragment(input, ";");
  await preview(page).getByRole("button").click();
  await preview(page).getByRole("button").click();
  await expect(preview(page).locator("#count")).toHaveText("2");
  await typeFragment(input, exercise.steps[4].text);
  await expect(page.getByRole("heading", { name: "Упражнение завершено!" })).toBeVisible();
  await expect(preview(page).getByRole("button")).toHaveText("Ещё +1");
  await expect(preview(page).locator("#count")).toHaveText("0");
  await preview(page).getByRole("button").click();
  await expect(preview(page).locator("#count")).toHaveText("1");
  await preview(page).getByRole("button").click();
  await expect(preview(page).locator("#count")).toHaveText("2");
  await expect(page.locator("iframe")).toHaveAttribute("sandbox", "allow-scripts");
  await page.screenshot({ path: "/tmp/code-typing-js-complete.png", fullPage: true });
});

for (const id of ["css-card", "css-flex", "html-card"]) {
  test(`verified final result of ${id}`, async ({ page }) => {
    const exercise = typingExercises.find((item) => item.id === id)!;
    await page.getByRole("button", { name: `Начать: ${exercise.title}` }).click();
    for (const step of exercise.steps) await typeFragment(page.getByRole("textbox"), step.text);
    await expect(page.getByRole("heading", { name: "Упражнение завершено!" })).toBeVisible();
    if (id === "css-card") {
      const card = preview(page).locator(".card");
      await expect(card).toHaveCSS("background-color", "rgb(255, 255, 255)");
      await expect(card).toHaveCSS("padding", "24px");
      await expect(card).toHaveCSS("border", "1px solid rgb(203, 213, 225)");
      await expect(card).toHaveCSS("border-radius", "16px");
      await expect(card).toHaveCSS("box-shadow", /^rgba\(15, 23, 42, 0\.1(?:02)?\) 0px 8px 24px 0px$/);
    } else if (id === "css-flex") {
      const container = preview(page).locator(".container");
      await expect(container).toHaveCSS("display", "flex");
      await expect(container).toHaveCSS("justify-content", "center");
      await expect(container).toHaveCSS("align-items", "center");
      await expect(container).toHaveCSS("gap", "16px");
    } else {
      await expect(preview(page).getByRole("heading", { level: 2 })).toHaveText("Мой первый сайт");
      await expect(preview(page).locator("#about")).toHaveText("Учусь создавать интерфейсы.");
      await expect(preview(page).getByRole("link", { name: "Об обучении" })).toHaveAttribute("href", "#about");
    }
  });
}

test("mobile input and ghost share geometry, allow multiline typing and do not overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Начать: Счётчик на JavaScript" }).click();
  const exercise = typingExercises.find((item) => item.id === "js-counter")!;
  const input = page.getByRole("textbox");
  for (const step of exercise.steps.slice(0, 3)) await typeFragment(input, step.text);
  await typeFragment(input, 'button.addEventListener("click", () => {\n  count');
  await expect(preview(page).locator("#count")).toHaveText("0");
  const geometry = await input.evaluate((field) => {
    const ghost = field.parentElement!.querySelector("pre")!;
    const a = field.getBoundingClientRect();
    const b = ghost.getBoundingClientRect();
    const style = getComputedStyle(field),
      ghostStyle = getComputedStyle(ghost);
    return {
      x: a.x - b.x,
      y: a.y - b.y,
      width: a.width - b.width,
      height: a.height - b.height,
      font: style.font === ghostStyle.font,
      padding: style.padding === ghostStyle.padding,
      overflow: document.documentElement.scrollWidth > innerWidth,
      scrollTop: field.scrollTop,
    };
  });
  expect(geometry).toEqual({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    font: true,
    padding: true,
    overflow: false,
    scrollTop: 0,
  });
  await page.screenshot({ path: "/tmp/code-typing-mobile.png", fullPage: true });
});
