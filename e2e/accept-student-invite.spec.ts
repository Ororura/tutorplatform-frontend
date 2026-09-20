import { expect, test } from "@playwright/test";

type RegistrationMode = "OPEN" | "INVITE_ONLY";

let originalMode: RegistrationMode | null = null;

test.beforeEach(async ({ request }) => {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

  const hostname = new URL(baseURL).hostname;

  if (!["localhost", "127.0.0.1"].includes(hostname)) {
    throw new Error("Registration mode can only be changed in a local environment");
  }

  const csrfResponse = await request.get("/api/v1/auth/csrf");

  expect(csrfResponse.ok()).toBeTruthy();

  const csrf = await csrfResponse.json();

  const loginResponse = await request.post("/api/v1/auth/login", {
    headers: {
      [csrf.headerName]: csrf.token,
    },
    data: {
      email: "teacher.demo@tutor.local",
      password: "DemoTeacher123!",
    },
  });

  expect(loginResponse.ok()).toBeTruthy();

  const settingsResponse = await request.get("/api/v1/admin/settings");

  expect(settingsResponse.ok()).toBeTruthy();

  const settings = await settingsResponse.json();

  originalMode = settings.registrationMode;

  expect(["OPEN", "INVITE_ONLY"]).toContain(originalMode);

  if (originalMode === "OPEN") {
    return;
  }

  const newCsrfResponse = await request.get("/api/v1/auth/csrf");

  expect(newCsrfResponse.ok()).toBeTruthy();

  const newCsrf = await newCsrfResponse.json();

  const updateResponse = await request.patch("/api/v1/admin/settings/registration", {
    headers: {
      [newCsrf.headerName]: newCsrf.token,
    },
    data: {
      mode: "OPEN",
    },
  });

  expect(updateResponse.ok()).toBeTruthy();
});

test.afterEach(async ({ request }) => {
  if (originalMode === null) {
    return;
  }

  const csrfResponse = await request.get("/api/v1/auth/csrf");

  expect(csrfResponse.ok()).toBeTruthy();

  const csrf = await csrfResponse.json();

  const response = await request.patch("/api/v1/admin/settings/registration", {
    headers: {
      [csrf.headerName]: csrf.token,
    },
    data: {
      mode: originalMode,
    },
  });

  expect(response.ok(), "Original registration mode must be restored").toBeTruthy();

  originalMode = null;
});

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

    await expect(studentPage).toHaveURL(/\/student\/homework$/);
    await expect(studentPage.getByRole("heading", { name: "Домашние задания" })).toBeVisible();

    const currentUserResponse = await studentPage.request.get("/api/v1/auth/me");
    expect(currentUserResponse.ok()).toBeTruthy();
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
