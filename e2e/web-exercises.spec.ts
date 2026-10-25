import { expect, test } from "@playwright/test";
import { fillCodeEditor } from "./helpers/journeys";
import templates from "../src/entities/task/model/web-exercise-templates.json";

const template = templates.find((item) => item.id === "dom-counter")!;
const files = { html: template.starter.html, css: template.starter.css, javascript: template.starter.javascript };

test("preview executes scripts with an opaque origin and blocks platform and network access", async ({
  page,
  request,
}) => {
  const response = await request.get("/web-preview");
  expect(response.headers()["content-security-policy"]).toContain("sandbox allow-scripts");
  expect(response.headers()["content-security-policy"]).not.toContain("allow-same-origin");
  await page.route("**/api/v1/**", (route) => route.fulfill({ status: 401, json: { code: "UNAUTHORIZED" } }));
  await page.goto("/login");
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        const frame = document.createElement("iframe");
        frame.id = "exercise-test";
        frame.setAttribute("sandbox", "allow-scripts");
        frame.src = "/web-preview";
        const ready = (event: MessageEvent) => {
          if (event.source !== frame.contentWindow || event.data?.type !== "web-preview-ready") return;
          removeEventListener("message", ready);
          frame.contentWindow!.postMessage(
            {
              type: "web-preview-source",
              files: {
                html: '<p id="answer">Старт</p>',
                css: "p { color: rgb(1, 2, 3); }",
                javascript:
                  "document.querySelector('#answer').textContent='Готово'; let blocked=0; try { parent.document.body; } catch { blocked++; } try { localStorage.getItem('session'); } catch { blocked++; } document.body.dataset.blocked=String(blocked); fetch('https://example.com').then(()=>document.body.dataset.network='allowed',()=>document.body.dataset.network='blocked'); console.log('Предпросмотр работает');",
              },
            },
            "*",
          );
          resolve();
        };
        addEventListener("message", ready);
        document.body.append(frame);
      }),
  );
  const frame = page.frameLocator("#exercise-test");
  await expect(frame.locator("#answer")).toHaveText("Готово");
  await expect(frame.locator("#answer")).toHaveCSS("color", "rgb(1, 2, 3)");
  await expect(frame.locator("body")).toHaveAttribute("data-blocked", "2");
  await expect(frame.locator("body")).toHaveAttribute("data-network", "blocked");
});

test("student edits only JavaScript, restores a draft, previews and sends server-check requests", async ({ page }) => {
  const requests: { path: string; body: Record<string, unknown> }[] = [];
  const source =
    "let n=0; document.querySelector('#increment').onclick=()=>document.querySelector('#count').textContent=++n;";
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/auth/me"))
      return route.fulfill({
        json: { id: "web-student", email: "web@test.local", displayName: "Ученик", roles: ["STUDENT"] },
      });
    if (path.endsWith("/auth/csrf")) return route.fulfill({ json: { headerName: "X-CSRF-TOKEN", token: "test" } });
    if (path.endsWith("/student/homeworks/web-homework"))
      return route.fulfill({
        json: {
          id: "web-homework",
          studentProgramId: "program",
          title: "Веб-практика",
          status: "ASSIGNED",
          assignedAt: "2026-10-22T10:00:00Z",
          overdue: false,
          items: [
            {
              id: "web-item",
              taskId: "web-task",
              position: 0,
              required: true,
              passed: false,
              task: {
                id: "web-task",
                title: template.title,
                descriptionMarkdown: template.description,
                taskType: "CODE",
                difficulty: "EASY",
                codeExecution: {
                  language: "WEB",
                  starterCode: JSON.stringify(template.starter),
                  executionEnabled: true,
                  timeLimitMs: 10000,
                  memoryLimitMb: 512,
                },
              },
            },
          ],
        },
      });
    if (path.endsWith("/submissions"))
      return route.fulfill({ json: { items: [], page: 0, size: 20, totalElements: 0, totalPages: 0 } });
    if (path.endsWith("/run") || path.endsWith("/code-submissions")) {
      requests.push({ path, body: route.request().postDataJSON() });
      return route.fulfill({
        status: path.endsWith("/run") ? 200 : 201,
        json: path.endsWith("/run")
          ? {
              executionId: "execution",
              status: "PASSED",
              passedTests: 2,
              totalTests: 2,
              executionTimeMs: 100,
              tests: [
                { position: 0, hidden: false, passed: true },
                { position: 1, hidden: false, passed: true },
              ],
            }
          : {
              id: "sent",
              taskId: "web-task",
              homeworkItemId: "web-item",
              attemptNo: 1,
              status: "PASSED",
              submittedAt: "2026-10-22T10:00:00Z",
            },
      });
    }
    return route.fulfill({ json: { items: [] } });
  });
  await page.goto("/student/homework/web-homework");
  await page.getByRole("button", { name: `Открыть: ${template.title}`, exact: true }).click();
  await fillCodeEditor(page, source);
  await page.getByRole("button", { name: "Обновить предпросмотр", exact: true }).click();
  const preview = page.frameLocator('iframe[title="Результат HTML, CSS и JavaScript"]');
  await preview.locator("#increment").click();
  await expect(preview.locator("#count")).toHaveText("1");
  await page.reload();
  await page.getByRole("button", { name: `Открыть: ${template.title}`, exact: true }).click();
  await expect(page.locator(".monaco-editor .view-lines")).toContainText("let n=0");
  await page.getByRole("tab", { name: /index.html/ }).click();
  await expect(page.locator(".monaco-editor .view-lines")).toContainText('<p id="count">');
  const lockedText = await page.locator(".monaco-editor .view-lines").textContent();
  await fillCodeEditor(page, "changed locked HTML");
  await expect(page.locator(".monaco-editor .view-lines")).toHaveText(lockedText!);
  await page.getByRole("tab", { name: /script.js/ }).click();
  await page.getByRole("button", { name: "Проверить", exact: true }).click();
  await expect(page.getByRole("region", { name: "Результаты проверки" })).toContainText("Повторные нажатия");
  expect(requests).toHaveLength(1);
  expect(requests[0].body).toEqual({
    homeworkItemId: "web-item",
    sourceCode: JSON.stringify({ ...files, javascript: source }),
  });
  await page.getByRole("button", { name: "Отправить решение", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Упражнение выполнено!");
  expect(requests).toHaveLength(2);
  await page.screenshot({ path: "/tmp/tutor-web-exercise-student.png", fullPage: true });
});

test("teacher creates a mixed-review web exercise from the catalog", async ({ page }) => {
  let created: Record<string, unknown> | null = null;
  await page.route("**/api/v1/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/auth/me"))
      return route.fulfill({
        json: { id: "teacher", email: "teacher@test.local", displayName: "Преподаватель", roles: ["TEACHER"] },
      });
    if (path.endsWith("/auth/csrf")) return route.fulfill({ json: { headerName: "X-CSRF-TOKEN", token: "test" } });
    if (path.endsWith("/teacher/subjects"))
      return route.fulfill({ json: [{ id: "web-subject", name: "Веб-разработка", code: "WEB", status: "ACTIVE" }] });
    if (path.endsWith("/teacher/tasks") && route.request().method() === "POST") {
      created = route.request().postDataJSON();
      return route.fulfill({ status: 201, json: { ...created, id: "created-web-task", status: "DRAFT", version: 0 } });
    }
    if (path.endsWith("/teacher/tasks/created-web-task"))
      return route.fulfill({ json: { ...created, id: "created-web-task", status: "DRAFT", version: 0 } });
    return route.fulfill({ json: { items: [], page: 0, size: 20, totalElements: 0, totalPages: 0 } });
  });
  await page.goto("/teacher/tasks");
  await page.getByRole("button", { name: "Создать задание", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Создать задание", exact: true });
  await dialog.getByLabel("Предмет", { exact: true }).selectOption("web-subject");
  await dialog.getByLabel("Тип", { exact: true }).selectOption("CODE");
  await dialog.getByLabel("Язык", { exact: true }).selectOption("WEB");
  await expect(dialog.getByLabel("Шаблон упражнения").locator("option")).toHaveCount(15);
  await dialog.getByLabel("Шаблон упражнения").selectOption("dom-counter");
  await dialog.getByLabel("Режим проверки").selectOption("HYBRID");
  await dialog.getByRole("button", { name: "Создать", exact: true }).click();
  await expect(page).toHaveURL(/created-web-task$/);
  const config = created!.programmingConfig as { language: string; starterCode: string };
  expect(config.language).toBe("WEB");
  expect(JSON.parse(config.starterCode).reviewMode).toBe("HYBRID");
  await expect(page.getByRole("heading", { name: template.title, exact: true })).toBeVisible();
});

test("teacher opens the saved web files and accepts a solution with feedback", async ({ page }) => {
  let decision: Record<string, unknown> | null = null;
  const submission = {
    id: "review-me",
    studentId: "student",
    taskId: "web-task",
    homeworkItemId: "web-item",
    attemptNo: 1,
    status: "NEEDS_REVIEW",
    submittedAt: "2026-10-22T10:00:00Z",
    execution: { status: "PASSED", passedTests: 2, totalTests: 2, executionTimeMs: 10 },
  };
  await page.route("**/api/v1/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/auth/me"))
      return route.fulfill({
        json: { id: "teacher", email: "teacher@test.local", displayName: "Преподаватель", roles: ["TEACHER"] },
      });
    if (path.endsWith("/auth/csrf")) return route.fulfill({ json: { headerName: "X-CSRF-TOKEN", token: "test" } });
    if (path.endsWith("/homeworks/web-homework"))
      return route.fulfill({
        json: {
          id: "web-homework",
          studentProgramId: "program",
          title: "Проверка веб-практики",
          status: decision ? "COMPLETED" : "ASSIGNED",
          assignedAt: "2026-10-22T10:00:00Z",
          items: [{ id: "web-item", taskId: "web-task", taskTitle: template.title, position: 0, required: true }],
        },
      });
    if (path.endsWith("/programs")) return route.fulfill({ json: [] });
    if (path.endsWith("/submissions"))
      return route.fulfill({
        json: {
          items: [{ ...submission, ...decision, reviewComment: decision?.comment }],
          page: 0,
          size: 100,
          totalElements: 1,
          totalPages: 1,
        },
      });
    if (path.endsWith("/submissions/review-me"))
      return route.fulfill({ json: { ...submission, sourceCode: JSON.stringify(files) } });
    if (path.endsWith("/review-me/review")) {
      decision = route.request().postDataJSON();
      return route.fulfill({ json: { ...submission, ...decision, reviewComment: decision?.comment } });
    }
    return route.fulfill({ json: { items: [] } });
  });
  await page.goto("/teacher/students/student/homework/web-homework");
  await page.getByRole("button", { name: "Открыть код и предпросмотр" }).click();
  await expect(page.frameLocator('iframe[title="Результат HTML, CSS и JavaScript"]').locator("#count")).toHaveText("0");
  await page.getByLabel("Комментарий преподавателя").fill("Хорошая работа, продолжайте практику.");
  await page.getByRole("button", { name: "Принять", exact: true }).click();
  await expect(page.getByText("Комментарий: Хорошая работа, продолжайте практику.")).toBeVisible();
  expect(decision).toEqual({ status: "PASSED", comment: "Хорошая работа, продолжайте практику." });
});
