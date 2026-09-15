import { expect, test } from "@playwright/test";

test("demo teacher assigns two real programs to Ilya", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill("teacher.demo@tutor.local");
  await page.getByLabel("Пароль", { exact: true }).fill("DemoTeacher123!");
  await page.getByRole("button", { name: "Войти" }).click();

  await page.getByLabel("Поиск ученика").fill("Илья");
  const ilyaPath = await page.getByRole("link", { name: /Илья Соколов/ }).getAttribute("href");
  expect(ilyaPath).toBeTruthy();
  await page.goto(ilyaPath!);
  await page.getByRole("link", { name: "Программа", exact: true }).click();
  await expect(page.locator("body")).toContainText(/У ученика пока нет программы обучения|Python/);

  if (await page.getByText("У ученика пока нет программы обучения").isVisible()) {
    await page.getByRole("button", { name: "Назначить программу" }).click();
    const firstDialog = page.getByRole("dialog", { name: "Назначить программу" });
    await expect(firstDialog.getByText("Python · Активна").first()).toBeVisible();
    await firstDialog.getByRole("radio", { name: /Python с нуля/ }).check();
    await firstDialog.getByLabel("Интервал отчёта, часов").fill("8");
    await firstDialog.getByRole("button", { name: "Назначить", exact: true }).click();
  } else if (await page.getByRole("link", { name: /Python с нуля/ }).isVisible()) {
    await page.getByRole("link", { name: /Python с нуля/ }).click();
  }

  await expect(page).toHaveURL(/\/teacher\/students\/[^/]+\/programs\/[^/]+$/);
  await expect(page.getByRole("heading", { name: "Python с нуля" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Основы Python" })).toBeVisible();
  await expect(page.getByText("Заблокирована").first()).toBeVisible();
  await page.getByRole("link", { name: /Переменные и типы данных/ }).click();
  await expect(page.getByRole("heading", { name: "Материалы" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Краткий конспект: переменные" })).toBeVisible();

  await page.goBack();
  await page.getByRole("button", { name: "Назначить ещё программу" }).click();
  const secondDialog = page.getByRole("dialog", { name: "Назначить программу" });
  await expect(secondDialog.getByRole("radio", { name: /Python с нуля/ })).toBeDisabled();
  if (await secondDialog.getByRole("radio", { name: /Python — начало обучения/ }).isEnabled()) {
    await secondDialog.getByRole("radio", { name: /Python — начало обучения/ }).check();
    await secondDialog.getByRole("button", { name: "Назначить", exact: true }).click();
  } else {
    await secondDialog.getByRole("button", { name: "Закрыть" }).click();
    await page.getByRole("link", { name: "← Программы ученика" }).click();
    await page.getByRole("link", { name: /Python — начало обучения/ }).click();
  }

  await expect(page.getByRole("heading", { name: "Python — начало обучения" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Python — начало обучения" })).toBeVisible();
  await page.getByRole("link", { name: "← Программы ученика" }).click();
  await expect(page.getByRole("link", { name: /Python с нуля/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Python — начало обучения/ })).toBeVisible();

  await page.getByRole("button", { name: "Назначить ещё программу" }).click();
  const repeatDialog = page.getByRole("dialog", { name: "Назначить программу" });
  await expect(repeatDialog.getByText("Уже назначена")).toHaveCount(2);
  await expect(repeatDialog.getByRole("button", { name: "Назначить", exact: true })).toBeDisabled();
});
