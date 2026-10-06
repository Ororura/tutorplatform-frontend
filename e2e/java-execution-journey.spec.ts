import { fillCodeEditor } from "./helpers/journeys";
import { expect, test } from "@playwright/test";
import { login, uniqueName } from "./helpers/journeys";

const starter =
  "import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        int n = new Scanner(System.in).nextInt();\n        // Выведите квадрат числа\n    }\n}";
const solution = starter.replace("// Выведите квадрат числа", "System.out.println(n * n);");

test("teacher creates Java task, student uses Monaco, runs and submits to PASSED", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await login(page, "teacher", "/teacher/tasks");
  await page.getByRole("button", { name: "Создать задание", exact: true }).click();
  const create = page.getByRole("dialog", { name: "Создать задание", exact: true });
  // Subjects and execution languages are independent: Java code can belong to any subject.
  await create.getByLabel("Предмет", { exact: true }).selectOption({ label: "Python" });
  const title = uniqueName("Java square");
  await create.getByLabel("Название", { exact: true }).fill(title);
  await create.getByLabel("Описание Markdown").fill("Прочитайте число и выведите его квадрат.");
  await create.getByLabel("Тип", { exact: true }).selectOption("CODE");
  await create.getByLabel("Язык", { exact: true }).selectOption("JAVA");
  await expect(create.getByLabel("Стартовый код")).toHaveValue(/public class Main/);
  await create.getByLabel("Стартовый код").fill(starter);
  await create.getByLabel("Ввод теста 1").fill("5");
  await create.getByLabel("Ожидаемый вывод теста 1").fill("25");
  await create.getByRole("button", { name: "Добавить тест" }).click();
  await create.getByLabel("Ввод теста 2").fill("-3");
  await create.getByLabel("Ожидаемый вывод теста 2").fill("9");
  await create.getByLabel("Скрытый тест").nth(1).check();
  const created = page.waitForResponse(
    (r) => r.request().method() === "POST" && new URL(r.url()).pathname === "/api/v1/teacher/tasks",
  );
  await create.getByRole("button", { name: "Создать", exact: true }).click();
  const task = await (await created).json();
  expect(task.programmingConfig.language).toBe("JAVA");
  await expect(page).toHaveURL(new RegExp(`/teacher/tasks/${task.id}$`));
  await page.reload();
  await page.getByRole("button", { name: "Редактировать", exact: true }).click();
  const edit = page.getByRole("dialog", { name: "Редактировать задание", exact: true });
  await expect(edit.getByLabel("Язык", { exact: true })).toHaveValue("JAVA");
  await expect(edit.getByLabel("Стартовый код")).toHaveValue(starter);
  await edit.getByLabel("Язык", { exact: true }).selectOption("PYTHON");
  await expect(edit.getByLabel("Стартовый код")).toHaveValue(starter);
  await edit.getByLabel("Язык", { exact: true }).selectOption("JAVA");
  await edit.getByRole("combobox", { name: "Статус", exact: true }).selectOption("ACTIVE");
  await edit.getByRole("button", { name: "Сохранить", exact: true }).click();
  await expect(edit).toBeHidden();

  const programs = await (await page.request.get("/api/v1/teacher/programs")).json();
  const source = programs.find((p: { title: string }) => p.title === "Python с нуля");
  const detail = await (await page.request.get(`/api/v1/teacher/programs/${source.id}`)).json();
  const topic = detail.modules
    .flatMap((m: { topics: { id: string; title: string }[] }) => m.topics)
    .find((t: { title: string }) => t.title === "Циклы for");
  const csrf = await (await page.request.get("/api/v1/auth/csrf")).json();
  const attached = await (await page.request.get(`/api/v1/teacher/topics/${topic.id}/tasks`)).json();
  const attach = await page.request.post(`/api/v1/teacher/topics/${topic.id}/tasks/${task.id}`, {
    headers: { [csrf.headerName]: csrf.token },
    data: {
      position: Math.max(0, ...attached.map((t: { position: number }) => t.position)) + 1,
      required: true,
    },
  });
  expect(attach.status()).toBe(201);
  await page.context().clearCookies();
  await login(page, "student");
  const enrolled = await (await page.request.get("/api/v1/student/programs")).json();
  const program = enrolled.find((p: { title: string }) => p.title === "Python с нуля");
  await page.goto(`/student/programs/${program.id}/topics/${topic.id}`);
  const entry = page.getByRole("listitem").filter({ has: page.getByRole("heading", { name: title, exact: true }) });
  await entry.getByRole("button", { name: "Решить", exact: true }).click();
  const editor = page.getByRole("textbox", { name: /Код решения/ });
  await expect(editor).toBeAttached();
  await expect(page.locator('[data-language="java"] .monaco-editor')).toBeVisible();
  await expect(page.getByText(/Программа запускается из класса Main/)).toBeVisible();
  await expect(page.locator(".monaco-editor .view-lines")).toContainText("class Main");
  const solutionRegion = page.locator('section[id$="-solution"]');
  await solutionRegion.screenshot({ path: "e2e-artifacts/java-desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await solutionRegion.screenshot({ path: "e2e-artifacts/java-mobile.png" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.setViewportSize({ width: 1280, height: 900 });
  await fillCodeEditor(page, solution);

  // Check the security invariant at the backend boundary. Chromium does not expose the body
  // of openapi-fetch's streamed Request to postDataJSON(), so send explicit tampered requests.
  const studentCsrf = await (await page.request.get("/api/v1/auth/csrf")).json();
  for (const endpoint of ["run", "code-submissions"]) {
    const tampered = await page.request.post(`/api/v1/student/tasks/${task.id}/${endpoint}`, {
      headers: { [studentCsrf.headerName]: studentCsrf.token },
      data: { studentProgramId: program.id, topicId: topic.id, sourceCode: solution, language: "PYTHON" },
    });
    expect(tampered.status()).toBe(400);
    expect(await tampered.json()).toMatchObject({ code: "VALIDATION_ERROR" });
  }

  const runPromise = page.waitForResponse(
    (r) => r.request().method() === "POST" && new URL(r.url()).pathname === `/api/v1/student/tasks/${task.id}/run`,
  );
  await page.getByRole("button", { name: "Запустить", exact: true }).click();
  const run = await runPromise;
  expect(run.status()).toBe(200);
  const result = await run.json();
  expect(result).toMatchObject({
    status: "PASSED",
    passedTests: 2,
    totalTests: 2,
  });
  expect(result).not.toHaveProperty("stdoutExcerpt");
  expect(result).not.toHaveProperty("stderrExcerpt");
  for (const outcome of result.tests) expect(Object.keys(outcome).sort()).toEqual(["hidden", "passed", "position"]);
  const submitPromise = page.waitForResponse(
    (r) =>
      r.request().method() === "POST" &&
      new URL(r.url()).pathname === `/api/v1/student/tasks/${task.id}/code-submissions`,
  );
  await page.getByRole("button", { name: "Отправить решение", exact: true }).click();
  const submitted = await submitPromise;
  expect(submitted.status()).toBe(201);
  expect(submitted.request().method()).toBe("POST");
  const submission = await submitted.json();
  expect(submission).toMatchObject({
    taskId: task.id,
    status: "PASSED",
    execution: { status: "PASSED", passedTests: 2, totalTests: 2 },
  });
  // Monaco applies indentation to multiline keyboard input; verify every persisted code line.
  const codeLines = (source: string) => source.split("\n").map((line) => line.trim());
  expect(codeLines(submission.sourceCode)).toEqual(codeLines(solution));
  await expect(page.getByRole("region", { name: "Результат отправки" })).toContainText("Решение принято");
  expect(errors).toEqual([]);
});
