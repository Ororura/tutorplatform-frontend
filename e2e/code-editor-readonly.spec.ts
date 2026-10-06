import { expect, test } from "@playwright/test";
import { fillCodeEditor, login } from "./helpers/journeys";

test("completed homework keeps the Monaco code editor read-only", async ({ page }) => {
  await login(page, "student");
  const list = await (await page.request.get("/api/v1/student/homeworks?status=COMPLETED&size=20")).json();
  const homework = await (await page.request.get(`/api/v1/student/homeworks/${list.items[0].id}`)).json();
  const item = homework.items.find((entry: { task: { taskType: string } }) => entry.task.taskType === "CODE");
  expect(item).toBeTruthy();
  await page.goto(`/student/homework/${homework.id}`);
  await page.getByRole("button", { name: `Открыть: ${item.task.title}`, exact: true }).click();
  const code = page.locator(".monaco-editor .view-lines");
  await expect(code).toBeVisible();
  const original = await code.innerText();
  await fillCodeEditor(page, "this must not replace the starter");
  await expect(code).toHaveText(original);
  await expect(page.getByRole("button", { name: "Запустить", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Отправить решение", exact: true })).toBeDisabled();
});
