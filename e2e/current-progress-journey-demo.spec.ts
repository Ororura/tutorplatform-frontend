import { expect, test, type APIRequestContext, type Locator, type Page } from "@playwright/test";

import type { components } from "../src/shared/api/generated/schema";

type Assessment = components["schemas"]["TeacherAssessmentResponse"];
type Progress = components["schemas"]["CurrentProgressResponse"];
type PublicProgress = components["schemas"]["PublicCurrentProgressResponse"];
type Share = components["schemas"]["ProgressShareSummaryResponse"];

const programTitle = "Python с нуля";
const scores = {
  understandingScore: 5,
  independenceScore: 4,
  practiceScore: 3,
  homeworkScore: 2,
};

// Progress share URLs are bearer credentials. Neither browser context records screenshots or traces.
test.use({ screenshot: "off", trace: "off" });

function metric(section: Locator, label: string): Locator {
  return section.getByText(label, { exact: true }).locator("..").locator("p").nth(1);
}

function average(section: Locator, label: string): Locator {
  return section.locator("dt").getByText(label, { exact: true }).locator("..").locator("dd");
}

function formattedAverage(value: number | null | undefined): string {
  return value === null || value === undefined
    ? "—"
    : new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 }).format(value);
}

function isMissing(value: number | null | undefined): value is null | undefined {
  return value === null || value === undefined;
}

async function expectProgress(
  page: Page,
  progress: Progress | PublicProgress,
  audience: "teacher" | "student" | "parent",
) {
  const section = page
    .getByRole("heading", { name: audience === "student" ? "Ваши результаты" : "Основные показатели" })
    .locator("..");
  const minutes = progress.totalLearningMinutes;
  const duration = isMissing(minutes)
    ? "—"
    : `${Math.floor(minutes / 60)} ч${minutes % 60 ? ` ${minutes % 60} мин` : ""}`;
  const attendance = isMissing(progress.attendanceRate)
    ? "—"
    : new Intl.NumberFormat("ru-RU", { style: "percent", maximumFractionDigits: 1 }).format(progress.attendanceRate);

  await expect(metric(section, audience === "student" ? "Пройдено учебных часов" : "Время обучения")).toHaveText(
    audience === "teacher" ? `${minutes ?? "—"}${isMissing(minutes) ? "" : " мин"}` : duration,
  );
  await expect(metric(section, audience === "student" ? "Пройденные занятия" : "Занятия")).toHaveText(
    String(progress.sessionsCount ?? "—"),
  );
  await expect(metric(section, audience === "student" ? "Посещаемость занятий" : "Посещаемость")).toHaveText(
    attendance,
  );
  await expect(
    metric(section, audience === "student" ? "Выполненные домашние задания" : "Домашние задания"),
  ).toHaveText(`${progress.homework?.completed} из ${progress.homework?.assigned}`);
  await expect(metric(section, audience === "student" ? "Выполненная практика" : "Практика")).toHaveText(
    `${progress.practice?.completed} из ${progress.practice?.assigned}`,
  );
  await expect(metric(section, audience === "parent" ? "Завершённые темы" : "Всего тем")).toHaveText(
    String(audience === "parent" ? progress.topics?.completed?.length : (progress as Progress).totalTopics),
  );

  const topicsSection = page.getByRole("heading", { name: "Темы программы" }).locator("..");
  for (const [title, topics, empty] of [
    ["Завершённые темы", progress.topics?.completed, "Завершённых тем пока нет."],
    ["В процессе изучения", progress.topics?.inProgress, "Сейчас нет тем в процессе изучения."],
  ] as const) {
    const topicSection = topicsSection.getByRole("heading", { name: title }).locator("..");
    if (topics?.length) {
      await expect(topicSection.locator("li")).toHaveText(topics.map((topic) => topic.title ?? "Без названия"));
    } else {
      await expect(topicSection.getByText(empty)).toBeVisible();
    }
  }

  const assessmentSection = page
    .getByRole("heading", {
      name: audience === "teacher" ? "Средние оценки преподавателя" : "Оценки преподавателя",
    })
    .locator("..");
  for (const [label, value] of [
    ["Понимание", progress.assessment?.understandingAverage],
    ["Самостоятельность", progress.assessment?.independenceAverage],
    ["Практика", progress.assessment?.practiceAverage],
    ["Домашние задания", progress.assessment?.homeworkAverage],
  ] as const) {
    await expect(average(assessmentSection, label)).toHaveText(formattedAverage(value));
  }
}

async function getProgress(request: APIRequestContext, path: string): Promise<Progress> {
  const response = await request.get(path);
  expect(response.status()).toBe(200);
  return (await response.json()) as Progress;
}

async function getShares(request: APIRequestContext, studentId: string, programId: string): Promise<Share[]> {
  const response = await request.get(`/api/v1/teacher/students/${studentId}/progress/shares`, {
    params: { studentProgramId: programId },
  });
  expect(response.status()).toBe(200);
  return ((await response.json()) as components["schemas"]["ProgressShareListResponse"]).items;
}

test("demo teacher assessment flows through teacher, student and public current progress", async ({
  page,
  browser,
}) => {
  test.setTimeout(120_000);
  const marker = `E2E PRIVATE current progress ${Date.now()}`;
  const comment = `E2E current progress ${Date.now()}`;

  await page.goto("/login?next=%2Fteacher%2Fstudents");
  expect(["localhost", "127.0.0.1", "::1"]).toContain(new URL(page.url()).hostname);
  await page.getByLabel("Email", { exact: true }).fill("teacher.demo@tutor.local");
  await page.getByLabel("Пароль", { exact: true }).fill("DemoTeacher123!");
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page).toHaveURL(/\/teacher\/students$/);

  await page.getByLabel("Поиск ученика").fill("Алексей");
  await page.getByRole("link", { name: /Алексей Иванов/ }).click();
  await expect(page.getByRole("heading", { name: "Алексей Иванов" })).toBeVisible();
  const studentId = new URL(page.url()).pathname.split("/")[3];

  await page.getByRole("link", { name: "Программа", exact: true }).click();
  await page.getByRole("link", { name: new RegExp(programTitle) }).click();
  await expect(page.getByRole("heading", { name: programTitle, exact: true })).toBeVisible();
  const programId = new URL(page.url()).pathname.split("/")[5];

  // A separate session leaves the report journey's dedicated program untouched.
  await page.goto(`/teacher/students/${studentId}/sessions/new`);
  await page.getByLabel("Программа обучения").selectOption(programId);
  await page.getByLabel("Длительность, минут").fill("60");
  await page.getByLabel("Личные заметки").fill(marker);
  await page.getByRole("button", { name: "Создать занятие" }).click();
  await expect(page).toHaveURL(/\/teacher\/students\/[^/]+\/sessions\/(?!new$)[^/]+$/);
  const sessionId = new URL(page.url()).pathname.split("/")[5];
  await expect(page.getByText(marker)).toBeVisible();

  await page.getByRole("button", { name: "Оценить занятие" }).click();
  for (const [label, value] of [
    ["Понимание материала", scores.understandingScore],
    ["Самостоятельность", scores.independenceScore],
    ["Практика", scores.practiceScore],
    ["Домашняя работа", scores.homeworkScore],
  ] as const) {
    await page.getByLabel(label, { exact: true }).fill(String(value));
  }
  await page.getByLabel("Комментарий для ученика").fill(comment);
  await page.getByRole("button", { name: "Сохранить оценку" }).click();
  await expect(page.getByRole("button", { name: "Редактировать оценку" })).toBeVisible();
  await page.reload();
  const assessmentSection = page.getByRole("heading", { name: "Оценка занятия" }).locator("..").locator("..");
  for (const [label, value] of [
    ["Понимание материала", scores.understandingScore],
    ["Самостоятельность", scores.independenceScore],
    ["Практика", scores.practiceScore],
    ["Домашняя работа", scores.homeworkScore],
  ] as const) {
    await expect(
      assessmentSection.locator("dt").getByText(label, { exact: true }).locator("..").locator("dd"),
    ).toHaveText(`${value} из 5`);
  }
  await expect(assessmentSection.getByText(comment)).toBeVisible();
  const assessmentResponse = await page.request.get(
    `/api/v1/teacher/students/${studentId}/sessions/${sessionId}/assessment`,
  );
  expect(assessmentResponse.status()).toBe(200);
  const assessment = (await assessmentResponse.json()) as Assessment;
  expect(assessment).toMatchObject({ lessonSessionId: sessionId, ...scores, publicComment: comment });

  await page.goto(`/teacher/students/${studentId}/progress`);
  await expect(page.getByRole("heading", { name: "Прогресс ученика" })).toBeVisible();
  await page.getByLabel("Программа обучения").selectOption(programId);
  const teacherProgress = await getProgress(
    page.request,
    `/api/v1/teacher/students/${studentId}/progress?studentProgramId=${programId}`,
  );
  expect(teacherProgress.studentProgramId).toBe(programId);
  expect(teacherProgress.sessionsCount).toBeGreaterThan(0);
  for (const value of Object.values(teacherProgress.assessment ?? {})) expect(value).not.toBeNull();
  expect(Object.keys(teacherProgress.assessment ?? {})).toHaveLength(4);
  await expectProgress(page, teacherProgress, "teacher");

  const studentContext = await browser.newContext({ baseURL: new URL(page.url()).origin });
  try {
    const studentPage = await studentContext.newPage();
    await studentPage.goto("/login?next=%2Fstudent%2Fprogress");
    await studentPage.getByLabel("Email", { exact: true }).fill("alex.demo@tutor.local");
    await studentPage.getByLabel("Пароль", { exact: true }).fill("DemoStudent123!");
    await studentPage.getByRole("button", { name: "Войти" }).click();
    await expect(studentPage.getByRole("heading", { name: "Мой прогресс" })).toBeVisible();
    await studentPage.getByLabel("Программа обучения").selectOption(programId);
    const studentProgress = await getProgress(
      studentContext.request,
      `/api/v1/student/progress?studentProgramId=${programId}`,
    );
    expect(studentProgress).toEqual(teacherProgress);
    await expectProgress(studentPage, studentProgress, "student");
  } finally {
    await studentContext.close();
  }

  const oldIds = new Set((await getShares(page.request, studentId, programId)).map((share) => share.id));
  await page.getByRole("button", { name: "Создать публичную ссылку" }).click();
  const shareInput = page.getByLabel("Публичная ссылка на прогресс");
  await expect(shareInput).toBeVisible();
  const publicPath = new URL(await shareInput.inputValue()).pathname;
  expect(publicPath).toMatch(/^\/progress\/[^/]+$/);
  const token = publicPath.split("/").at(-1)!;
  const share = (await getShares(page.request, studentId, programId)).find((item) => !oldIds.has(item.id));
  expect(share?.status).toBe("ACTIVE");
  await page.reload(); // The one-time bearer URL is no longer rendered.

  const publicContext = await browser.newContext({ baseURL: new URL(page.url()).origin });
  try {
    expect(await publicContext.cookies()).toEqual([]);
    const publicPage = await publicContext.newPage();
    await publicPage.goto("/");
    await publicPage.evaluate((path) => window.location.assign(path), publicPath);
    await expect(publicPage.getByRole("heading", { name: "Текущий прогресс ученика" })).toBeVisible();
    const publicResponse = await publicContext.request.get(`/api/v1/public/progress/${token}`);
    expect(publicResponse.status()).toBe(200);
    const publicProgress = (await publicResponse.json()) as PublicProgress;
    expect(publicProgress).toEqual({
      totalLearningMinutes: teacherProgress.totalLearningMinutes,
      sessionsCount: teacherProgress.sessionsCount,
      attendanceRate: teacherProgress.attendanceRate,
      topics: {
        completed: teacherProgress.topics?.completed?.map((topic) => ({ title: topic.title })),
        inProgress: teacherProgress.topics?.inProgress?.map((topic) => ({ title: topic.title })),
      },
      homework: teacherProgress.homework,
      practice: teacherProgress.practice,
      assessment: teacherProgress.assessment,
    });
    await expectProgress(publicPage, publicProgress, "parent");
    const publicJson = JSON.stringify(publicProgress);
    for (const key of [
      "privateNotes",
      "publicComment",
      "studentProgramId",
      "id",
      "status",
      "token",
      "tokenHash",
      "createdAt",
      "updatedAt",
      "version",
    ]) {
      expect(publicJson).not.toContain(`"${key}"`);
    }
    expect(publicJson).not.toContain(marker);
    await expect(publicPage.locator("body")).not.toContainText(marker);
    await expect(publicPage.locator("body")).not.toContainText(comment);

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Отозвать" }).last().click();
    await expect
      .poll(
        async () => (await getShares(page.request, studentId, programId)).find((item) => item.id === share?.id)?.status,
      )
      .toBe("REVOKED");
    await publicPage.reload();
    await expect(publicPage.getByText("Ссылка больше не действует")).toBeVisible();
    expect((await publicContext.request.get(`/api/v1/public/progress/${token}`)).status()).toBe(410);
  } finally {
    await publicContext.close();
  }
});
