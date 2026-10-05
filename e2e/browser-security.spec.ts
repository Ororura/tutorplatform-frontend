import { expect, test, type APIResponse, type Page } from "@playwright/test";

// Public tokens are bearer credentials; never record these tests in traces/screenshots.
test.use({ screenshot: "off", trace: "off" });

function expectSecurityHeaders(response: APIResponse, optimizedImage = false) {
  const headers = response.headers();
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBe("no-referrer");
  expect(headers["permissions-policy"]).toContain("clipboard-write=(self)");
  expect(headers["permissions-policy"]).toContain("camera=()");
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  if (optimizedImage) {
    expect(headers["content-security-policy"]).toBe("default-src 'none'; frame-ancestors 'none'; sandbox");
  } else {
    expect(headers["content-security-policy"]).toContain("connect-src 'self'");
  }
  expect(headers["content-security-policy"]).not.toMatch(/unsafe-eval|\*/);
  expect(headers["strict-transport-security"]).toBeUndefined();
}

async function recordViolations(page: Page) {
  const violations: string[] = [];
  await page.exposeFunction("recordCspViolation", (directive: string) => violations.push(directive));
  await page.addInitScript(() => {
    document.addEventListener("securitypolicyviolation", (event) => {
      const report = (window as unknown as { recordCspViolation: (directive: string) => Promise<void> })
        .recordCspViolation;
      void report(`${event.effectiveDirective}: ${event.blockedURI} at ${event.sourceFile}:${event.lineNumber}`);
    });
  });
  return violations;
}

async function login(page: Page, role: "teacher" | "student") {
  await page.goto(`/login?next=%2F${role}`);
  await page
    .getByLabel("Email", { exact: true })
    .fill(role === "teacher" ? "teacher.demo@tutor.local" : "alex.demo@tutor.local");
  await page.getByLabel("Пароль", { exact: true }).fill(role === "teacher" ? "DemoTeacher123!" : "DemoStudent123!");
  await page.getByRole("button", { name: "Войти", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/${role}$`));
  await expect(page.getByRole("heading", { name: /^Добрый день/ })).toBeVisible();
}

test("production page and error responses have fresh nonces on every Next.js script", async ({ request }) => {
  let previousNonce = "";
  for (const path of [
    "/login",
    "/teacher",
    "/student",
    "/progress/unavailable",
    "/reports/unavailable",
    "/invite/student/unavailable",
    "/invite/teacher/unavailable",
    "/missing-security-test-page",
  ]) {
    const response = await request.get(path, { headers: { "Content-Security-Policy": "script-src 'nonce-attacker'" } });
    expectSecurityHeaders(response);
    const csp = response.headers()["content-security-policy"];
    const nonce = /'nonce-([^']+)'/.exec(csp)![1];
    expect(Buffer.from(nonce, "base64")).toHaveLength(32);
    expect(nonce).not.toBe(previousNonce);
    expect(csp).not.toContain("attacker");
    previousNonce = nonce;
    expect(response.headers()["cache-control"]).toContain("no-store");
    const html = await response.text();
    const scripts = html.match(/<script\b[^>]*>/g) ?? [];
    expect(scripts.length).toBeGreaterThan(0);
    for (const script of scripts) expect(script).toContain(`nonce="${nonce}"`);
  }
});

test("API success/errors, cookies, static bundles and optimized images retain headers", async ({ request }) => {
  const csrf = await request.get("/api/v1/auth/csrf");
  expect(csrf.status()).toBe(200);
  expectSecurityHeaders(csrf);
  expect(csrf.headers()["set-cookie"]).toContain("TUTOR_SESSION=");
  expect((await csrf.json()).headerName).toBe("X-XSRF-TOKEN");
  const anonymous = await request.get("/api/v1/auth/me");
  expect(anonymous.status()).toBe(401);
  expectSecurityHeaders(anonymous);
  const html = await (await request.get("/login")).text();
  const assets = [...html.matchAll(/(?:src|href)="([^" ]+\.(?:js|css))"/g)].map((match) => match[1]);
  expect(assets.length).toBeGreaterThan(0);
  for (const path of [
    ...new Set(assets),
    "/favicon.png",
    "/images/student-miku.png",
    "/_next/image?url=%2Fimages%2Fstudent-miku.png&w=640&q=75",
    "/templates/python-conditions.yaml",
  ]) {
    const asset = await request.get(path);
    expect(asset.status()).toBe(200);
    expectSecurityHeaders(asset, path.startsWith("/_next/image"));
  }
});

test("login and teacher client navigations hydrate without CSP violations", async ({ page }) => {
  const violations = await recordViolations(page);
  await login(page, "teacher");
  await page.getByRole("link", { name: "Задания", exact: true }).first().click();
  await expect(page.getByRole("heading", { name: "Банк заданий", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Ученики", exact: true }).first().click();
  await expect(page.getByRole("heading", { name: "Ученики", exact: true })).toBeVisible();
  expect(violations).toEqual([]);
});

test("student code editor, same-origin run/submit and image assets work under CSP", async ({ page }) => {
  test.setTimeout(120_000);
  const violations = await recordViolations(page);
  await login(page, "student");
  // Keep same-origin image CSP coverage independent of decorative dashboard content.
  await page.evaluate(() => {
    const image = document.createElement("img");
    image.src = "/images/student-miku.png";
    image.alt = "Проверка локального изображения";
    image.width = 160;
    document.body.append(image);
  });
  const image = page.getByRole("img", { name: "Проверка локального изображения" });
  await expect(image).toBeVisible();
  await expect
    .poll(() => image.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0))
    .toBe(true);
  const response = await page.request.get("/api/v1/student/homeworks?status=ASSIGNED&size=20&sort=assignedAt,desc");
  const list = await response.json();
  const detailResponse = await page.request.get(`/api/v1/student/homeworks/${list.items[0].id}`);
  const homework = await detailResponse.json();
  const item = homework.items.find((candidate: { task: { taskType: string } }) => candidate.task.taskType === "CODE");
  expect(item).toBeTruthy();
  await page.goto(`/student/homework/${homework.id}`);
  await page.getByRole("button", { name: `Открыть: ${item.task.title}`, exact: true }).click();
  await page.getByLabel("Код решения").fill('print("Hello, World!")');
  await page.getByRole("button", { name: "Запустить", exact: true }).click();
  await expect(page.getByRole("region", { name: "Результат запуска" })).toContainText("Тесты:", { timeout: 60_000 });
  await page.getByRole("button", { name: "Отправить решение", exact: true }).click();
  await expect(page.getByRole("region", { name: "Результат отправки" })).toContainText("Попытка", { timeout: 60_000 });
  expect(violations).toEqual([]);
});

test("public progress and report hydrate, and report PDF downloads under CSP", async ({ page }) => {
  const violations = await recordViolations(page);
  await page.goto("/progress/demo_progress_alex_8wN3fK6qR1xV9mC4sT7yH2pL5zB0aD");
  await expect(page.getByRole("heading", { name: "Текущий прогресс ученика" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Основные показатели" })).toBeVisible();
  await page.goto("/reports/demo_report_alex_5qT9mV2xH7kR4wC8sN1yL6pB3zF0aJ");
  await expect(page.getByRole("heading", { name: "Результаты периода" })).toBeVisible();
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Скачать PDF", exact: true }).click();
  expect((await downloaded).suggestedFilename()).toMatch(/\.pdf$/);
  expect(violations).toEqual([]);
});

test("browser enforces script nonce and same-origin connections while allowing image previews", async ({ page }) => {
  await page.goto("/login");
  // Execute the probe as a normal same-origin script. CDP evaluation (and
  // synchronously inserted scripts from it) can bypass CSP in Chromium.
  await page.route("**/security-policy-probe.js", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: `
      (async () => {
        const script = document.createElement("script");
        script.textContent = "window.inlineInjected = true";
        document.body.append(script);
        let evalBlocked = false;
        try { window.eval("window.evalInjected = true"); }
        catch { evalBlocked = true; }
        let externalBlocked = false;
        try { await fetch("https://example.invalid/security-test"); }
        catch { externalBlocked = true; }
        const image = new Image();
        const url = URL.createObjectURL(new Blob(
          ['<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"/>'],
          { type: "image/svg+xml" }
        ));
        image.src = url;
        await image.decode();
        URL.revokeObjectURL(url);
        window.securityProbe = {
          injected: !!(window.inlineInjected || window.evalInjected),
          evalBlocked, externalBlocked, imageWidth: image.naturalWidth
        };
      })();
    `,
    }),
  );
  await page.evaluate(() => {
    const script = document.createElement("script");
    script.src = "/security-policy-probe.js";
    document.body.append(script);
  });
  await page.waitForFunction(() => "securityProbe" in window);
  const result = await page.evaluate(() => (window as unknown as { securityProbe: unknown }).securityProbe);
  expect(result).toEqual({ injected: false, evalBlocked: true, externalBlocked: true, imageWidth: 2 });
});
