import { expect, test } from "@playwright/test";

type RegistrationMode = "OPEN" | "INVITE_ONLY";

test("admin invites a teacher while public registration is closed", async ({ browser, page: adminPage }, testInfo) => {
  const adminEmail = "teacher.demo@tutor.local";
  const adminPassword = "DemoTeacher123!";

  const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

  const hostname = new URL(baseURL).hostname;

  if (!["localhost", "127.0.0.1"].includes(hostname)) {
    throw new Error("This test is restricted to a local environment");
  }

  const suffix = `${Date.now()}-${testInfo.workerIndex}`;

  const teacherEmail = `invited-teacher-${suffix}@example.com`;

  const teacherPassword = "teacher test password 2026";

  let originalMode: RegistrationMode | null = null;

  const adminRequest = adminPage.context().request;

  // 1. Administrator authentication.

  await adminPage.goto("/login");

  await adminPage.getByLabel("Email", { exact: true }).fill(adminEmail);

  await adminPage.getByLabel("Пароль", { exact: true }).fill(adminPassword);

  await adminPage.getByRole("button", { name: "Войти" }).click();

  await expect(adminPage).toHaveURL((url) => url.pathname.startsWith("/admin") || url.pathname.startsWith("/teacher"));

  const adminMeResponse = await adminPage.context().request.get("/api/v1/auth/me");

  expect(adminMeResponse.ok()).toBeTruthy();

  const adminUser = await adminMeResponse.json();

  expect(adminUser.roles, "Demo account must have the ADMIN role in the local database").toContain("ADMIN");

  await adminPage.goto("/admin");

  await expect(
    adminPage.getByRole("heading", {
      name: "Управление платформой",
    }),
  ).toBeVisible();

  // 2. Remember the original registration mode.

  const initialSettings = await adminRequest.get("/api/v1/admin/settings");

  expect(initialSettings.ok()).toBeTruthy();

  const settings = await initialSettings.json();

  originalMode = settings.registrationMode;

  expect(["OPEN", "INVITE_ONLY"]).toContain(originalMode);

  const guestContext = await browser.newContext();
  const secondGuestContext = await browser.newContext();

  try {
    // 3. Change registration mode through the real UI.

    await adminPage.goto("/admin/settings");

    const inviteOnlyRadio = adminPage.getByRole("radio", { name: /Регистрация по приглашению/ });

    await expect(inviteOnlyRadio).toBeVisible();

    if (!(await inviteOnlyRadio.isChecked())) {
      await inviteOnlyRadio.check();

      await adminPage
        .getByRole("button", {
          name: "Сохранить изменения",
        })
        .click();

      await expect(adminPage.getByText("Настройки сохранены")).toBeVisible();
    }

    // 4. Public registration must be unavailable.

    const guestPage = await guestContext.newPage();

    await guestPage.goto("/register");

    await expect(
      guestPage.getByRole("heading", {
        name: "Регистрация по приглашению",
      }),
    ).toBeVisible();

    await expect(
      guestPage.getByRole("button", {
        name: "Зарегистрироваться",
      }),
    ).toHaveCount(0);

    // 5. Administrator creates an invitation.

    await adminPage.goto("/admin/invitations");

    await adminPage.getByLabel("Email преподавателя").fill(teacherEmail);

    await adminPage
      .getByRole("button", {
        name: "Создать приглашение",
      })
      .click();

    const invitationUrlInput = adminPage.getByLabel("Ссылка приглашения");

    await expect(invitationUrlInput).toBeVisible();

    const invitationUrl = await invitationUrlInput.inputValue();

    expect(invitationUrl).toContain("/invite/teacher/");

    // Use the local frontend origin.
    const invitationPath = new URL(invitationUrl).pathname;

    // 6. A new teacher opens the invitation.

    await guestPage.goto(invitationPath);

    await expect(
      guestPage.getByRole("heading", {
        name: "Присоединиться к платформе",
      }),
    ).toBeVisible();

    await expect(guestPage.getByText(teacherEmail)).toBeVisible();

    // 7. Teacher completes registration.

    await guestPage.getByLabel("Как к вам обращаться?").fill("Тестовый преподаватель");

    await guestPage.getByLabel("Придумайте пароль").fill(teacherPassword);

    await guestPage.getByLabel("Повторите пароль").fill(teacherPassword);

    await guestPage
      .getByRole("button", {
        name: "Создать аккаунт преподавателя",
      })
      .click();

    await expect(guestPage).toHaveURL((url) => url.pathname === "/teacher/students");

    // 8. Verify the authenticated session.

    const currentUserResponse = await guestPage.context().request.get("/api/v1/auth/me");

    expect(currentUserResponse.ok()).toBeTruthy();

    const currentUser = await currentUserResponse.json();

    expect(currentUser).toMatchObject({
      email: teacherEmail,
      roles: ["TEACHER"],
    });

    // Session must survive page reload.

    await guestPage.reload();

    await expect(guestPage).toHaveURL((url) => url.pathname === "/teacher/students");

    // 9. Invitation cannot be reused.

    const secondGuestPage = await secondGuestContext.newPage();

    await secondGuestPage.goto(invitationPath);

    await expect(
      secondGuestPage.getByRole("heading", {
        name: "Приглашение недействительно",
      }),
    ).toBeVisible();

    await expect(secondGuestPage.getByText("Это приглашение уже было использовано.")).toBeVisible();

    // 10. Administrator sees the accepted invitation.

    await adminPage.goto("/admin/invitations");

    const invitationRow = adminPage.getByRole("listitem").filter({
      hasText: teacherEmail,
    });

    await expect(invitationRow.getByText("Принято")).toBeVisible();
  } finally {
    // Restore the previous registration mode,
    // including when an assertion fails.

    if (originalMode !== null) {
      const csrfResponse = await adminRequest.get("/api/v1/auth/csrf");

      if (!csrfResponse.ok()) {
        throw new Error("Failed to get CSRF token for settings restoration");
      }

      const csrf = await csrfResponse.json();

      const restoreResponse = await adminRequest.patch("/api/v1/admin/settings/registration", {
        headers: {
          [csrf.headerName]: csrf.token,
        },
        data: {
          mode: originalMode,
        },
      });

      expect(restoreResponse.ok(), "Original registration mode must be restored").toBeTruthy();
    }

    await guestContext.close();
    await secondGuestContext.close();
  }
});
