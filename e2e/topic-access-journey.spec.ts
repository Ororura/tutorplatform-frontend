import { expect, test } from "@playwright/test";

import {
  activateProgram,
  assignProgramToAlex,
  createProgram,
  importPackage,
  login,
  previewPackage,
  uniqueName,
} from "./helpers/journeys";

test("locked topic rejects direct access, teacher opens it, student starts learning", async ({
  page,
  browser,
  baseURL,
}) => {
  test.setTimeout(120_000);
  const title = uniqueName("topic access");
  const topicTitle = "Release access topic";
  await login(page, "teacher");
  await createProgram(page, title);
  const { dialog } = await previewPackage(
    page,
    `schemaVersion: 1
kind: modules
modules:
  - title: Release access module
    topics:
      - title: ${topicTitle}
        materials:
          - title: Release access material
            materialType: MARKDOWN
            content: Only available after teacher opens access.
`,
  );
  await importPackage(dialog);
  await activateProgram(page);
  const { studentId, studentProgramId } = await assignProgramToAlex(page, title);
  const teacherPath = new URL(page.url()).pathname;
  const programResponse = await page.request.get(`/api/v1/teacher/students/${studentId}/programs/${studentProgramId}`);
  expect(programResponse.status()).toBe(200);
  const program = await programResponse.json();
  const topicId: string = program.modules[0].topics[0].id;
  expect(program.modules[0].topics[0].progressStatus).toBe("LOCKED");

  const student = await browser.newContext({ baseURL });
  try {
    const studentPage = await student.newPage();
    await login(studentPage, "student");
    const studentPath = `/student/programs/${studentProgramId}`;
    const topicPath = `${studentPath}/topics/${topicId}`;
    await studentPage.goto(studentPath);
    await expect(studentPage.getByRole("heading", { name: title, exact: true })).toBeVisible();
    await expect(studentPage.getByLabel(`Тема «${topicTitle}» заблокирована`, { exact: true })).toBeVisible();
    await expect(studentPage.getByRole("link", { name: new RegExp(topicTitle) })).toHaveCount(0);
    await studentPage.goto(topicPath);
    await expect(studentPage.getByRole("heading", { name: "Тема пока заблокирована" })).toBeVisible();
    const locked = await studentPage.request.get(`/api/v1/student/programs/${studentProgramId}/topics/${topicId}`);
    expect(locked.status()).toBe(403);
    expect((await locked.json()).code).toBe("STUDENT_TOPIC_LOCKED");
    await expect(studentPage.getByText("Only available after teacher opens access.")).toHaveCount(0);

    await page.goto(teacherPath);
    await page.getByRole("button", { name: "Управлять доступом к темам" }).click();
    await page.getByRole("heading", { name: "Release access module", exact: true }).click();
    await page.getByRole("checkbox", { name: `Выбрать тему «${topicTitle}»`, exact: true }).check();
    await page.getByRole("button", { name: "Открыть выбранные" }).click();
    await expect(page.getByRole("status")).toContainText("Доступ к выбранным темам открыт.");
    await studentPage.goto(studentPath);
    await expect(studentPage.getByRole("link", { name: new RegExp(`${topicTitle}.*Доступна`) })).toBeVisible();
    await studentPage.getByRole("link", { name: new RegExp(topicTitle) }).click();
    await expect(studentPage.getByRole("heading", { name: topicTitle, exact: true })).toBeVisible();
    await expect(studentPage.getByRole("region", { name: "Учебные материалы" })).toContainText(
      "Only available after teacher opens access.",
    );
    await expect
      .poll(async () => {
        const response = await studentPage.request.get(`/api/v1/student/programs/${studentProgramId}`);
        expect(response.status()).toBe(200);
        return (await response.json()).modules[0].topics[0].progressStatus;
      })
      .toBe("IN_PROGRESS");
    await studentPage.goto(studentPath);
    await expect(studentPage.getByRole("link", { name: new RegExp(topicTitle) })).toContainText("В процессе");
    await page.reload();
    await page.getByRole("heading", { name: "Release access module", exact: true }).click();
    await expect(page.getByRole("link", { name: new RegExp(topicTitle) })).toContainText("В процессе");
  } finally {
    await student.close();
  }
});
