import { expect, test } from "@playwright/test";

import { expectMobileLayout } from "./helpers/journeys";

// Even demo bearer links follow the public artifact policy.
test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, screenshot: "off", trace: "off" });

test("public current progress and published report fit mobile and PDF CTA is accessible", async ({ page }) => {
  await page.goto("/progress/demo_progress_alex_8wN3fK6qR1xV9mC4sT7yH2pL5zB0aD");
  await expect(page.getByRole("heading", { name: "Текущий прогресс ученика" })).toBeVisible();
  await expectMobileLayout(page, page.getByRole("heading", { name: "Основные показатели" }));
  await page.goto("/reports/demo_report_alex_5qT9mV2xH7kR4wC8sN1yL6pB3zF0aJ");
  await expect(page.getByRole("heading", { name: "Результаты периода" })).toBeVisible();
  const downloadButton = page.getByRole("button", { name: "Скачать PDF", exact: true });
  await expectMobileLayout(page, downloadButton);
  const download = page.waitForEvent("download");
  await downloadButton.click();
  expect(await (await download).failure()).toBeNull();
});
