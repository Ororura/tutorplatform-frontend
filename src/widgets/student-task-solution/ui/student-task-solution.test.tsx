import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { StudentTaskSolution } from "./student-task-solution";
const mocks = vi.hoisted(() => ({
  useQuery: vi.fn(),

  submitText: {
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    data: undefined,
  },

  runCode: {
    mutate: vi.fn(),
    reset: vi.fn(),
    isPending: false,
    isError: false,
    data: undefined,
  },

  submitCode: {
    mutate: vi.fn(),
    reset: vi.fn(),
    isPending: false,
    isError: false,
    data: undefined,
  },
}));

vi.mock("@tanstack/react-query", () => ({ useQuery: mocks.useQuery, queryOptions: (value: unknown) => value }));
vi.mock("@/entities/submission", () => ({
  studentSubmissionQueries: {
    list: (taskId: string, itemId: string) => ({ queryKey: ["student-submissions", taskId, itemId] }),
  },
  submissionStatusPresentation: {
    NEEDS_REVIEW: "Ожидает проверки",
    PASSED: "Выполнено",
    FAILED: "Не принято",
    SUBMITTED: "Отправлено",
    SYSTEM_ERROR: "Ошибка проверки",
  },
  executionStatusPresentation: {
    PASSED: "Все тесты пройдены",
    FAILED: "Есть непройденные тесты",
    TIMEOUT: "Превышено время выполнения",
    RUNTIME_ERROR: "Ошибка выполнения",
    SYSTEM_ERROR: "Не удалось выполнить код",
    PENDING: "Ожидает запуска",
    RUNNING: "Выполняется",
  },
}));
vi.mock("@/features/submission/submit-text", () => ({ useSubmitTextAnswerMutation: () => mocks.submitText }));
vi.mock("@/features/execution/run-code", () => ({ useRunStudentCodeMutation: () => mocks.runCode }));
vi.mock("@/features/submission/submit-code", () => ({ useSubmitCodeAnswerMutation: () => mocks.submitCode }));

const base = {
  id: "item-1",
  taskId: "task-1",
  position: 0,
  required: true,
  passed: false,
  task: {
    id: "task-1",
    title: "Задание",
    descriptionMarkdown: "Описание **как текст**",
    difficulty: "EASY" as const,
  },
};

describe("StudentTaskSolution widget", () => {
  beforeEach(() => {
    mocks.useQuery.mockReset();

    mocks.useQuery.mockReturnValue({
      data: {
        items: [],
        page: 0,
        size: 20,
        totalElements: 0,
        totalPages: 0,
      },
      isPending: false,
    });

    mocks.submitText.mutate.mockReset();
    mocks.submitText.isPending = false;
    mocks.submitText.isError = false;
    mocks.submitText.data = undefined;

    mocks.runCode.mutate.mockReset();
    mocks.runCode.reset.mockReset();
    mocks.runCode.isPending = false;
    mocks.runCode.isError = false;
    mocks.runCode.data = undefined;

    mocks.submitCode.mutate.mockReset();
    mocks.submitCode.reset.mockReset();
    mocks.submitCode.isPending = false;
    mocks.submitCode.isError = false;
    mocks.submitCode.data = undefined;
  });

  it("submits TEXT answer without code or student-controlled submission fields", () => {
    render(
      <StudentTaskSolution
        homeworkId="homework-1"
        homeworkStatus="ASSIGNED"
        item={{ ...base, task: { ...base.task, taskType: "TEXT" } }}
      />,
    );
    fireEvent.change(screen.getByLabelText("Ваш ответ"), { target: { value: "Мой ответ" } });
    fireEvent.click(screen.getByRole("button", { name: "Отправить" }));

    expect(mocks.submitText.mutate).toHaveBeenCalledWith({
      taskId: "task-1",
      homeworkItemId: "item-1",
      textAnswer: "Мой ответ",
    });
  });

  it("shows NEEDS_REVIEW from persisted attempts", () => {
    mocks.useQuery.mockReturnValue({
      data: {
        items: [
          {
            id: "submission-1",
            taskId: "task-1",
            homeworkItemId: "item-1",
            attemptNo: 1,
            status: "NEEDS_REVIEW",
            submittedAt: "2026-09-01T10:00:00Z",
          },
        ],
      },
      isPending: false,
    });
    render(
      <StudentTaskSolution
        homeworkId="homework-1"
        homeworkStatus="ASSIGNED"
        item={{ ...base, task: { ...base.task, taskType: "TEXT" } }}
      />,
    );
    expect(screen.getByText(/Ожидает проверки/)).toBeInTheDocument();
  });

  it("initializes CODE editor and keeps Run distinct from Submit", () => {
    render(
      <StudentTaskSolution
        homeworkId="homework-1"
        homeworkStatus="ASSIGNED"
        item={{
          ...base,
          task: {
            ...base.task,
            taskType: "CODE",
            codeExecution: {
              language: "PYTHON",
              starterCode: "print('start')",
              executionEnabled: true,
              timeLimitMs: 1000,
              memoryLimitMb: 128,
            },
          },
        }}
      />,
    );
    const editor = screen.getByLabelText("Код решения");
    expect(editor).toHaveValue("print('start')");
    fireEvent.change(editor, { target: { value: "print(1)" } });
    fireEvent.click(screen.getByRole("button", { name: "Запустить" }));
    fireEvent.click(screen.getByRole("button", { name: "Отправить решение" }));
    expect(mocks.runCode.mutate).toHaveBeenCalledWith({
      taskId: "task-1",
      homeworkItemId: "item-1",
      sourceCode: "print(1)",
    });
    expect(mocks.submitCode.mutate).toHaveBeenCalledWith({
      taskId: "task-1",
      homeworkItemId: "item-1",
      sourceCode: "print(1)",
    });
  });

  it("uses the standalone topic context without a homework item", () => {
    render(
      <StudentTaskSolution
        practice={{
          studentProgramId: "program-1",
          topicId: "topic-1",
          task: {
            id: "task-1",
            title: "Практика",
            descriptionMarkdown: "Решите задачу",
            taskType: "CODE",
            difficulty: "EASY",
            position: 0,
            required: true,
            programmingConfig: {
              language: "PYTHON",
              starterCode: "print('starter')",
              executionEnabled: true,
              timeLimitMs: 1000,
              memoryLimitMb: 128,
            },
          },
        }}
      />,
    );

    const editor = screen.getByLabelText("Код решения");
    expect(editor).toHaveValue("print('starter')");
    fireEvent.change(editor, { target: { value: "print(42)" } });
    fireEvent.click(screen.getByRole("button", { name: "Запустить" }));
    fireEvent.click(screen.getByRole("button", { name: "Отправить решение" }));

    expect(mocks.runCode.mutate).toHaveBeenCalledWith({
      taskId: "task-1",
      studentProgramId: "program-1",
      topicId: "topic-1",
      sourceCode: "print(42)",
    });
    expect(mocks.submitCode.mutate).toHaveBeenCalledWith({
      taskId: "task-1",
      studentProgramId: "program-1",
      topicId: "topic-1",
      sourceCode: "print(42)",
    });
  });

  it("does not mix homework attempts into standalone practice history", () => {
    mocks.useQuery.mockReturnValue({
      data: {
        items: [
          {
            id: "homework-submission",
            taskId: "task-1",
            homeworkItemId: "homework-item-1",
            attemptNo: 1,
            status: "FAILED",
            submittedAt: "2026-09-01T10:00:00Z",
          },
          {
            id: "practice-submission",
            taskId: "task-1",
            homeworkItemId: null,
            attemptNo: 2,
            status: "PASSED",
            submittedAt: "2026-09-01T11:00:00Z",
          },
        ],
      },
      isPending: false,
    });

    render(
      <StudentTaskSolution
        practice={{
          studentProgramId: "program-1",
          topicId: "topic-1",
          task: {
            id: "task-1",
            title: "Практика",
            descriptionMarkdown: "Решите задачу",
            taskType: "CODE",
            difficulty: "EASY",
            position: 0,
            required: true,
            programmingConfig: { language: "PYTHON", executionEnabled: true, timeLimitMs: 1000, memoryLimitMb: 128 },
          },
        }}
      />,
    );

    expect(screen.getByText("Попытка 2")).toBeInTheDocument();
    expect(screen.queryByText("Попытка 1")).not.toBeInTheDocument();
    expect(screen.queryByText("Не принято")).not.toBeInTheDocument();
  });

  it("shows the expanded Python execution guide only for CODE tasks", () => {
    const { rerender } = render(
      <StudentTaskSolution
        homeworkId="homework-1"
        homeworkStatus="ASSIGNED"
        item={{
          ...base,
          task: {
            ...base.task,
            taskType: "CODE",
            codeExecution: { language: "PYTHON", executionEnabled: true, timeLimitMs: 1000, memoryLimitMb: 128 },
          },
        }}
      />,
    );

    const guide = screen.getByText("Как выполнить задание").closest("details");
    expect(guide).not.toBeNull();
    expect(guide).toHaveAttribute("open");
    expect(screen.getByText(/Для чтения входных данных используйте input\(\)/)).toBeInTheDocument();
    expect(
      screen.getByText(
        "Преподаватель мог заранее подготовить для вас часть решения. Если в редакторе уже есть код, внимательно изучите его и дополните или измените согласно условию задания. Необязательно писать программу с нуля",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Программа считывает два числа из одной строки и выводит их сумму")).toBeInTheDocument();
    expect(screen.getByText(/Входные данные для проверки подаются автоматически/)).toBeInTheDocument();
    expect(screen.getByText("Когда решение считается верным?")).toBeInTheDocument();
    expect(
      screen.getByText(/Программа считается верной, когда успешно проходит все тесты задания/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Прочитайте два числа и выведите их сумму/)).toBeInTheDocument();
    expect(screen.getByText(/Если ожидаемый ответ — 5/)).toBeInTheDocument();
    expect(screen.getByText(/input\(\) получает входные данные/)).toBeInTheDocument();
    expect(
      screen.getByText(/Успешное прохождение одного примера не гарантирует прохождение всех тестов/),
    ).toBeInTheDocument();
    expect(screen.getByText(/«Запустить» — проверить код/)).toBeInTheDocument();
    expect(screen.getByText(/«Отправить решение» — сохранить ответ/)).toBeInTheDocument();

    rerender(
      <StudentTaskSolution
        homeworkId="homework-1"
        homeworkStatus="ASSIGNED"
        item={{ ...base, task: { ...base.task, taskType: "TEXT" } }}
      />,
    );

    expect(screen.queryByText("Как выполнить задание")).not.toBeInTheDocument();
  });

  it.each([
    ["PASSED", "Все тесты пройдены"],
    ["FAILED", "Есть непройденные тесты"],
  ] as const)("renders safe %s run outcome without hidden test content", (status, label) => {
    mocks.runCode.data = {
      executionId: "run-1",
      status,
      passedTests: status === "PASSED" ? 2 : 1,
      totalTests: 2,
      stdoutExcerpt: "visible stdout",
      stderrExcerpt: "visible stderr",
      tests: [
        { position: 0, hidden: false, passed: true },
        { position: 1, hidden: true, passed: status === "PASSED", expectedOutput: "secret" },
      ],
    } as never;
    render(
      <StudentTaskSolution
        homeworkId="homework-1"
        homeworkStatus="ASSIGNED"
        item={{
          ...base,
          task: {
            ...base.task,
            taskType: "CODE",
            codeExecution: { language: "PYTHON", executionEnabled: true, timeLimitMs: 1000, memoryLimitMb: 128 },
          },
        }}
      />,
    );
    expect(screen.getByText(label)).toBeInTheDocument();
    expect(screen.getByText(/Скрытый тест/)).toBeInTheDocument();
    expect(screen.getByText("visible stdout")).toBeInTheDocument();
    expect(screen.getByText("visible stderr")).toBeInTheDocument();
    expect(screen.queryByText("secret")).not.toBeInTheDocument();
  });

  it("disables only the pending submit action to prevent double submit", () => {
    mocks.submitText.isPending = true;
    render(
      <StudentTaskSolution
        homeworkId="homework-1"
        homeworkStatus="ASSIGNED"
        item={{ ...base, task: { ...base.task, taskType: "TEXT" } }}
      />,
    );
    expect(screen.getByRole("button", { name: "Отправляем…" })).toBeDisabled();
  });
});
