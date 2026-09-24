import { expect, test, type APIRequestContext, type APIResponse, type Locator, type Page } from "@playwright/test";

import type { components } from "../src/shared/api/generated/schema";

type LearningPeriod = components["schemas"]["LearningPeriodResponse"];
type Report = components["schemas"]["ProgressReportDetailsResponse"];
type PublicReport = components["schemas"]["PublicProgressReportResponse"];

const demoProgram = "Python: практический проект";
const privateMarker = "E2E PRIVATE: только преподавателю";

// The share URL is a bearer credential. Keep it out of Playwright traces and screenshots.
test.use({ trace: "off", screenshot: "off" });

async function periods(request: APIRequestContext, studentId: string, programId: string): Promise<LearningPeriod[]> {
  const response = await request.get(`/api/v1/teacher/students/${studentId}/programs/${programId}/learning-periods`);
  expect(response.status()).toBe(200);
  return (await response.json()) as LearningPeriod[];
}

async function report(request: APIRequestContext, reportId: string): Promise<Report> {
  const response = await request.get(`/api/v1/teacher/reports/${reportId}`);
  expect(response.status()).toBe(200);
  return (await response.json()) as Report;
}

async function expectPdf(response: APIResponse) {
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toMatch(/^application\/pdf(?:;|$)/i);
  const body = await response.body();
  expect(body.length).toBeGreaterThan(100);
  expect(body.subarray(0, 5).toString()).toBe("%PDF-");
}

function metric(section: Locator, label: string): Locator {
  return section
    .locator("dt")
    .filter({ hasText: new RegExp(`^${label}$`) })
    .locator("..")
    .locator("dd");
}

async function expectSnapshot(page: Page, snapshot: Report["snapshot"]) {
  const section = page.getByRole("heading", { name: "Результаты периода" }).locator("..");
  const metricsGrid = section.locator(":scope > dl");
  const metrics = snapshot.metrics!;
  const learningMinutes = metrics.learningMinutes!;
  const duration =
    learningMinutes < 60
      ? `${learningMinutes} мин`
      : `${Math.floor(learningMinutes / 60)} ч${learningMinutes % 60 ? ` ${learningMinutes % 60} мин` : ""}`;
  await expect(metric(metricsGrid, "Учебное время")).toHaveText(duration);
  await expect(metric(metricsGrid, "Занятия")).toHaveText(String(metrics.sessionsCount));
  await expect(metric(metricsGrid, "Посещаемость")).toHaveText(
    new Intl.NumberFormat("ru-RU", { style: "percent", maximumFractionDigits: 1 }).format(metrics.attendanceRate!),
  );
  await expect(metric(metricsGrid, "Домашние задания")).toHaveText(
    `${metrics.homeworkCompleted} из ${metrics.homeworkAssigned}`,
  );
  await expect(metric(metricsGrid, "Практика")).toHaveText(
    `${metrics.practiceCompleted} из ${metrics.practiceAssigned}`,
  );

  for (const [label, topics] of [
    ["Завершённые темы", snapshot.topics?.completed],
    ["Темы в процессе", snapshot.topics?.inProgress],
  ] as const) {
    const topicSection = section.getByRole("heading", { name: label }).locator("..");
    if (topics?.length) {
      await expect(topicSection.locator("li")).toHaveText(topics.map((topic) => topic.title!));
    } else {
      await expect(topicSection.getByText("Нет тем.")).toBeVisible();
    }
  }

  for (const [label, value] of [
    ["Понимание", snapshot.assessment?.understandingAverage],
    ["Самостоятельность", snapshot.assessment?.independenceAverage],
    ["Практика", snapshot.assessment?.practiceAverage],
    ["Домашние задания", snapshot.assessment?.homeworkAverage],
  ] as const) {
    const assessments = section.getByRole("heading", { name: "Средние оценки" }).locator("..");
    await expect(metric(assessments, label)).toHaveText(
      value === null || value === undefined
        ? "—"
        : new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 }).format(value),
    );
  }
}

test("demo teacher creates, publishes, shares and revokes a progress report", async ({ page, browser }) => {
  test.setTimeout(120_000);

  await page.goto("/login?next=%2Fteacher%2Fstudents");
  await page.getByLabel("Email", { exact: true }).fill("teacher.demo@tutor.local");
  await page.getByLabel("Пароль", { exact: true }).fill("DemoTeacher123!");
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page).toHaveURL(/\/teacher\/students$/);

  await page.getByLabel("Поиск ученика").fill("Алексей");
  await page.getByRole("link", { name: /Алексей Иванов/ }).click();
  await expect(page).toHaveURL(/\/teacher\/students\/[^/]+$/);
  await expect(page.getByRole("heading", { name: "Алексей Иванов" })).toBeVisible();
  const studentId = new URL(page.url()).pathname.split("/")[3];

  await page.getByRole("link", { name: "Программа", exact: true }).click();
  await page.getByRole("link", { name: new RegExp(demoProgram) }).click();
  await expect(page.getByRole("heading", { name: demoProgram })).toBeVisible();
  const programId = new URL(page.url()).pathname.split("/")[5];

  let available = (await periods(page.request, studentId, programId)).find(
    (period) => period.status === "COMPLETED" && !period.reportId,
  );
  if (!available) {
    // The seeded period can be consumed once. A new attended session completes the
    // next period in this dedicated demo program; no database reset or SQL is needed.
    await page.goto(`/teacher/students/${studentId}/sessions/new`);
    await page.getByLabel("Программа обучения").selectOption(programId);
    await page.getByLabel("Длительность, минут").fill("300");
    await page.getByRole("checkbox", { name: "Чтение CSV" }).check();
    await page.getByLabel("Личные заметки").fill(privateMarker);
    await page.getByRole("button", { name: "Создать занятие" }).click();
    await expect(page).toHaveURL(/\/teacher\/students\/[^/]+\/sessions\/(?!new$)[^/]+$/);
    await expect
      .poll(async () =>
        (await periods(page.request, studentId, programId)).find(
          (period) => period.status === "COMPLETED" && !period.reportId,
        ),
      )
      .toBeDefined();
    available = (await periods(page.request, studentId, programId)).find(
      (period) => period.status === "COMPLETED" && !period.reportId,
    );
  }
  expect(available).toBeDefined();
  const period = available!;

  await page.goto(`/teacher/students/${studentId}/reports`);
  await expect(page.getByRole("heading", { name: "Отчёты об успеваемости" })).toBeVisible();
  await page.getByLabel("Программа обучения").selectOption(programId);
  await expect(page.getByRole("button", { name: `Создать черновик для периода ${period.sequenceNo}` })).toBeVisible();
  await page.getByRole("button", { name: `Создать черновик для периода ${period.sequenceNo}` }).click();
  await expect(page).toHaveURL(/\/teacher\/students\/[^/]+\/reports\/[^/]+$/);
  const reportId = new URL(page.url()).pathname.split("/")[5];
  const draft = await report(page.request, reportId);
  expect(draft.status).toBe("DRAFT");
  expect(draft.learningPeriodId).toBe(period.id);
  expect(draft.snapshot.metrics?.learningMinutes).toBe(draft.learningMinutes);
  expect((await periods(page.request, studentId, programId)).find((item) => item.id === period.id)?.reportId).toBe(
    reportId,
  );
  await expect(page.getByText("Черновик", { exact: true })).toBeVisible();
  await expectSnapshot(page, draft.snapshot);

  const summary = `Итоги E2E периода ${period.sequenceNo}`;
  const plan = `План E2E периода ${period.sequenceNo + 1}`;
  await page.getByRole("textbox", { name: "Итоги периода" }).fill(summary);
  await page.getByRole("textbox", { name: "План на следующий период" }).fill(plan);
  await page.getByRole("button", { name: "Сохранить черновик" }).click();
  await expect(page.getByRole("status")).toContainText("Черновик сохранён.");
  await page.reload();
  await expect(page.getByRole("textbox", { name: "Итоги периода" })).toHaveValue(summary);
  await expect(page.getByRole("textbox", { name: "План на следующий период" })).toHaveValue(plan);
  const saved = await report(page.request, reportId);
  expect(saved.teacherSummary).toBe(summary);
  expect(saved.nextPeriodPlan).toBe(plan);

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Опубликовать" }).click();
  await expect(page.getByText("Опубликован", { exact: true })).toBeVisible();
  const published = await report(page.request, reportId);
  expect(published.status).toBe("PUBLISHED");
  expect(published.publishedAt).toBeTruthy();
  await expect(page.getByRole("textbox", { name: "Итоги периода" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Сохранить черновик" })).toHaveCount(0);
  await expect(page.getByText("Этот отчёт хранит исторический snapshot и доступен только для чтения.")).toBeVisible();

  const teacherPdfResponse = page.waitForResponse((response) =>
    response.url().endsWith(`/api/v1/teacher/reports/${reportId}/pdf`),
  );
  const teacherDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Скачать PDF" }).click();
  expect((await teacherPdfResponse).status()).toBe(200);
  expect(await (await teacherDownload).failure()).toBeNull();
  await expectPdf(await page.request.get(`/api/v1/teacher/reports/${reportId}/pdf`));

  const oldSharesResponse = await page.request.get(`/api/v1/teacher/reports/${reportId}/shares`);
  expect(oldSharesResponse.status()).toBe(200);
  const oldShares = (await oldSharesResponse.json()) as components["schemas"]["ReportShareListResponse"];
  const oldIds = new Set(oldShares.items?.map((share) => share.id));
  await page.getByRole("button", { name: "Создать публичную ссылку" }).click();
  const shareInput = page.getByLabel("Публичная ссылка на отчёт");
  await expect(shareInput).toBeVisible();
  const shareUrl = await shareInput.inputValue();
  const publicPath = new URL(shareUrl).pathname;
  const token = publicPath.split("/").at(-1)!;
  expect(publicPath.startsWith("/reports/")).toBe(true);
  const sharesResponse = await page.request.get(`/api/v1/teacher/reports/${reportId}/shares`);
  expect(sharesResponse.status()).toBe(200);
  const shares = (await sharesResponse.json()) as components["schemas"]["ReportShareListResponse"];
  const share = shares.items?.find((item) => !oldIds.has(item.id));
  expect(share?.status).toBe("ACTIVE");
  await page.reload(); // Removes the one-time bearer URL from any later failure snapshot.

  const publicContext = await browser.newContext({ baseURL: new URL(page.url()).origin, acceptDownloads: true });
  try {
    expect(await publicContext.cookies()).toEqual([]);
    const publicPage = await publicContext.newPage();
    await publicPage.goto("/");
    await publicPage.evaluate((path) => window.location.assign(path), publicPath);
    await expect(publicPage.getByRole("heading", { name: "Результаты периода" })).toBeVisible();
    const publicResponse = await publicContext.request.get(`/api/v1/public/reports/${token}`);
    expect(publicResponse.status()).toBe(200);
    const publicReport = (await publicResponse.json()) as PublicReport;
    expect(publicReport.learningMinutes).toBe(published.learningMinutes);
    expect(publicReport.periodStartedAt).toBe(published.periodStartedAt);
    expect(publicReport.periodEndedAt).toBe(published.periodEndedAt);
    expect(publicReport.publishedAt).toBe(published.publishedAt);
    expect(publicReport.snapshot.metrics).toEqual(published.snapshot.metrics);
    expect(publicReport.snapshot.assessment).toEqual(published.snapshot.assessment);
    expect(publicReport.snapshot.topics?.completed?.map((topic) => topic.title)).toEqual(
      published.snapshot.topics?.completed?.map((topic) => topic.title),
    );
    expect(publicReport.snapshot.topics?.inProgress?.map((topic) => topic.title)).toEqual(
      published.snapshot.topics?.inProgress?.map((topic) => topic.title),
    );
    expect(publicReport.snapshot.skills?.map((skill) => [skill.name, skill.progress])).toEqual(
      published.snapshot.skills?.map((skill) => [skill.name, skill.progress]),
    );
    expect(publicReport.teacherSummary).toBe(summary);
    expect(publicReport.nextPeriodPlan).toBe(plan);
    await expectSnapshot(publicPage, published.snapshot);
    const publicJson = JSON.stringify(publicReport);
    for (const key of [
      "privateNotes",
      "generatedByTeacherId",
      "tokenHash",
      "studentProgramId",
      "learningPeriodId",
      "reportId",
      "version",
      "createdAt",
      "updatedAt",
    ]) {
      expect(publicJson.includes(`"${key}"`)).toBe(false);
    }
    expect(publicJson.includes(privateMarker)).toBe(false);
    await expect(publicPage.locator("body")).not.toContainText(privateMarker);

    const publicPdfResponse = publicPage.waitForResponse((response) =>
      response.url().endsWith(`/api/v1/public/reports/${token}/pdf`),
    );
    const publicDownload = publicPage.waitForEvent("download");
    await publicPage.getByRole("button", { name: "Скачать PDF" }).click();
    expect((await publicPdfResponse).status()).toBe(200);
    expect(await (await publicDownload).failure()).toBeNull();
    await expectPdf(await publicContext.request.get(`/api/v1/public/reports/${token}/pdf`));

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Отозвать доступ" }).last().click();
    await expect(page.getByText("Отозвана", { exact: true })).toBeVisible();
    const revokedSharesResponse = await page.request.get(`/api/v1/teacher/reports/${reportId}/shares`);
    expect(revokedSharesResponse.status()).toBe(200);
    const revokedShares = (await revokedSharesResponse.json()) as components["schemas"]["ReportShareListResponse"];
    expect(revokedShares.items?.find((item) => item.id === share?.id)?.status).toBe("REVOKED");

    await publicPage.reload();
    await expect(publicPage.getByRole("heading", { name: "Ссылка больше не действует" })).toBeVisible();
    expect((await publicContext.request.get(`/api/v1/public/reports/${token}`)).status()).toBe(410);
    expect((await publicContext.request.get(`/api/v1/public/reports/${token}/pdf`)).status()).toBe(410);
  } finally {
    await publicContext.close();
  }
});
