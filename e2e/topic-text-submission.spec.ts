import { expect, test } from "@playwright/test";

for (const width of [1440, 390]) {
  test(`topic TEXT submission, retry and persisted history at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const task = {
      id: "task-text",
      title: "Что делает условие if?",
      descriptionMarkdown: "Объясните назначение условия.",
      taskType: "TEXT",
      difficulty: "EASY",
      required: true,
      position: 0,
    };
    const topic = { id: "topic-1", title: "Условия", progressStatus: "IN_PROGRESS", materials: [] };
    let fail = true;
    const attempts: {
      id: string;
      studentProgramId: string;
      taskId: string;
      homeworkItemId: null;
      status: string;
      textAnswer: string;
      attemptNo: number;
      submittedAt: string;
      reviewComment?: string;
    }[] = [];
    await page.route("**/api/v1/**", async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      if (url.pathname.endsWith("/auth/csrf"))
        return route.fulfill({ json: { token: "test-csrf", headerName: "X-XSRF-TOKEN" } });
      if (url.pathname.endsWith("/auth/me"))
        return route.fulfill({ json: { id: "student", displayName: "Ученик", roles: ["STUDENT"] } });
      if (url.pathname.endsWith("/tasks/task-text/submissions")) {
        if (request.method() === "POST") {
          expect(request.postDataJSON()).toEqual({
            studentProgramId: "program-1",
            topicId: "topic-1",
            textAnswer: "if выполняет код, когда условие истинно.",
          });
          if (fail) {
            fail = false;
            return route.fulfill({ status: 500, json: { code: "INTERNAL_ERROR", message: "Retry" } });
          }
          const submission = {
            id: `submission-${attempts.length + 1}`,
            studentProgramId: "program-1",
            taskId: task.id,
            homeworkItemId: null,
            status: "NEEDS_REVIEW",
            textAnswer: request.postDataJSON().textAnswer,
            attemptNo: attempts.length + 1,
            submittedAt: new Date().toISOString(),
          };
          attempts.unshift(submission);
          return route.fulfill({ status: 201, json: submission });
        }
        expect(url.searchParams.get("studentProgramId")).toBe("program-1");
        expect(url.searchParams.get("topicId")).toBe("topic-1");
        return route.fulfill({
          json: { items: attempts, page: 0, size: 20, totalElements: attempts.length, totalPages: 1 },
        });
      }
      if (url.pathname.endsWith("/topics/topic-1/tasks")) return route.fulfill({ json: [task] });
      if (url.pathname.endsWith("/topics/topic-1")) return route.fulfill({ json: topic });
      if (url.pathname.endsWith("/programs/program-1"))
        return route.fulfill({
          json: { id: "program-1", title: "Python", modules: [{ id: "module-1", title: "Основы", topics: [topic] }] },
        });
      return route.fulfill({ status: 404, json: {} });
    });
    await page.goto("/student/programs/program-1/topics/topic-1");
    await page.getByRole("button", { name: "Решить", exact: true }).click();
    const input = page.getByRole("textbox", { name: "Ваш ответ", exact: true });
    await input.fill("if выполняет код, когда условие истинно.");
    await page.getByRole("button", { name: "Отправить", exact: true }).click();
    await expect(page.getByRole("main").getByRole("alert")).toContainText("Не удалось отправить ответ");
    await expect(input).toHaveValue("if выполняет код, когда условие истинно.");
    await page.getByRole("button", { name: "Отправить", exact: true }).click();
    await expect(page.getByRole("region", { name: "История попыток" })).toContainText("Попытка 1");
    attempts[0].status = "PASSED";
    attempts[0].reviewComment = "Верно, добавьте пример.";
    await page.reload();
    await page.getByRole("button", { name: "Решить", exact: true }).click();
    const history = page.getByRole("region", { name: "История попыток" });
    await expect(history).toContainText("Выполнено");
    await history.getByText("Ответ и комментарий", { exact: true }).click();
    await expect(history).toContainText("if выполняет код, когда условие истинно.");
    await expect(history).toContainText("Верно, добавьте пример.");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
