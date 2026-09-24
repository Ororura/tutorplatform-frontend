import { expect, test } from "@playwright/test";

test("teacher and student complete the authentication and invitation flow", async ({ browser, page }, testInfo) => {
  const suffix = `${Date.now()}-${testInfo.workerIndex}`;
  const teacherEmail = `teacher-${suffix}@example.com`;
  const studentEmail = `student-${suffix}@example.com`;
  const teacherPassword = "teacher password 2026";
  const studentPassword = "student password 2026";

  await page.goto("/register");
  await page.getByLabel("Имя", { exact: true }).fill("Егор");
  await page.getByLabel("Email", { exact: true }).fill(teacherEmail);
  await page.getByLabel("Пароль", { exact: true }).fill(teacherPassword);
  await page.getByLabel("Повторите пароль", { exact: true }).fill(teacherPassword);
  await page.getByRole("button", { name: "Зарегистрироваться" }).click();

  await expect(page).toHaveURL(/\/teacher\/students$/);
  await expect(page.getByRole("heading", { name: "Ученики" })).toBeVisible();

  await page.reload();
  await expect(page).toHaveURL(/\/teacher\/students$/);
  await expect(page.getByRole("heading", { name: "Ученики" })).toBeVisible();

  await page.getByRole("button", { name: "Добавить ученика" }).first().click();
  const createStudentDialog = page.getByRole("dialog", { name: "Добавить ученика" });
  await createStudentDialog.getByLabel("Имя", { exact: true }).fill("Андрей");
  await createStudentDialog.getByLabel("Фамилия", { exact: true }).fill("Иванов");
  await createStudentDialog.getByRole("button", { name: "Добавить ученика" }).click();
  await expect(page.getByRole("link", { name: /Андрей Иванов/ })).toBeVisible();

  await page.getByRole("link", { name: /Андрей Иванов/ }).click();
  await expect(page.getByRole("heading", { name: "Андрей Иванов" })).toBeVisible();
  await page.getByRole("button", { name: "Редактировать" }).click();
  await page.getByLabel("Фамилия", { exact: true }).fill("Петров");
  await page.getByRole("button", { name: "Сохранить" }).click();
  await expect(page.getByRole("heading", { name: "Андрей Петров" })).toBeVisible();

  await page.getByRole("button", { name: "Отправить приглашение" }).click();
  const inviteDialog = page.getByRole("dialog", { name: "Отправить приглашение" });
  await inviteDialog.getByLabel("Email ученика").fill(studentEmail);
  await inviteDialog.getByRole("button", { name: "Создать приглашение" }).click();
  const inviteUrl = await inviteDialog.getByLabel("Ссылка-приглашение").inputValue();
  expect(inviteUrl).toContain("/invite/student/");

  const studentContext = await browser.newContext();
  try {
    const studentPage = await studentContext.newPage();
    await studentPage.goto(inviteUrl);

    await expect(studentPage.getByRole("heading", { name: "Принять приглашение" })).toBeVisible();
    await expect(studentPage.getByText("Андрей Петров")).toBeVisible();
    await expect(studentPage.getByText("Егор", { exact: true })).toBeVisible();
    await expect(studentPage.getByText(studentEmail)).toBeVisible();

    await studentPage.getByLabel("Придумайте пароль").fill(studentPassword);
    await studentPage.getByRole("button", { name: "Принять приглашение" }).click();

    await expect(studentPage).toHaveURL(/\/student$/);
    await expect(studentPage.getByRole("heading", { name: "Домашние задания" })).toBeVisible();

    const cookies = await studentContext.cookies();

    const currentUserResponse = await studentPage.request.get(`${new URL(studentPage.url()).origin}/api/v1/auth/me`);
    expect(
      currentUserResponse.ok(),
      `GET /api/v1/auth/me returned ${currentUserResponse.status()}: ${await currentUserResponse.text()}`,
    ).toBeTruthy();
    await expect(currentUserResponse.json()).resolves.toMatchObject({
      email: studentEmail,
      roles: ["STUDENT"],
    });
  } finally {
    await studentContext.close();
  }

  await page.reload();
  await expect(page.locator("dl").getByText("Зарегистрирован", { exact: true })).toBeVisible();

  await page.goto("/teacher/students");
  await page.getByRole("button", { name: "Выйти" }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.goto("/teacher/students");
  await expect(page).toHaveURL(/\/login\?next=%2Fteacher%2Fstudents$/);
});
