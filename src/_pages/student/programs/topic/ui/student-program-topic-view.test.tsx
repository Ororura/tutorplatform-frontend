import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiClientError } from "@/shared/api/client";

import { StudentProgramTopicView } from "./student-program-topic-view";

const mocks = vi.hoisted(() => ({ useQuery: vi.fn() }));

vi.mock("@tanstack/react-query", () => ({
  useQuery: mocks.useQuery,
  queryOptions: (value: unknown) => value,
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/widgets/student-task-solution", () => ({
  StudentTaskSolution: ({
    practice,
  }: {
    practice: { studentProgramId: string; topicId: string; task: { title: string } };
  }) => (
    <div data-testid="practice-solution">
      {practice.studentProgramId}/{practice.topicId}/{practice.task.title}
    </div>
  ),
}));

const program = {
  id: "program-1",
  title: "Python с нуля",
  modules: [
    {
      id: "module-1",
      title: "Основы",
      topics: [
        { id: "topic-before", title: "Введение" },
        { id: "topic-current", title: "Переменные" },
      ],
    },
    {
      id: "module-2",
      title: "Практика",
      topics: [{ id: "topic-after", title: "Условия" }],
    },
  ],
};

const topic = {
  id: "topic-current",
  title: "Переменные",
  description: "## Что изучим\nРаботу с **данными**",
  moduleId: "module-1",
  moduleTitle: "Основы",
  progressStatus: "IN_PROGRESS" as const,
  materials: [
    {
      id: "material-second",
      materialType: "MARKDOWN" as const,
      title: "Сначала в ответе API",
      content: "### Конспект\nТекст",
      position: 20,
    },
    {
      id: "material-first",
      materialType: "CODE_EXAMPLE" as const,
      title: "Затем в ответе API",
      content: "value = 1",
      position: 10,
    },
    {
      id: "private-file-key-must-not-appear",
      materialType: "FILE" as const,
      title: "Рабочая тетрадь",
      position: 30,
    },
  ],
};

type QueryState = {
  data: unknown;
  error: unknown;
  isPending: boolean;
  isError: boolean;
  isSuccess: boolean;
  refetch: ReturnType<typeof vi.fn>;
};

function queryState(data: unknown): QueryState {
  return { data, error: null, isPending: false, isError: false, isSuccess: true, refetch: vi.fn() };
}

function mockQueries(
  topicState: QueryState = queryState(topic),
  programState: QueryState = queryState(program),
  tasksState: QueryState = queryState([]),
) {
  mocks.useQuery.mockImplementation((options: { queryKey: readonly unknown[] }) => {
    if (options?.queryKey?.[0] === "student-topic-tasks") return tasksState;
    return options?.queryKey?.includes("topic") ? topicState : programState;
  });
}

function apiError(status: number) {
  return new ApiClientError(status, {
    code: status === 403 ? "FORBIDDEN" : "NOT_FOUND",
    message: "error",
    timestamp: "2026-09-21T00:00:00Z",
    traceId: "trace",
    details: [],
  });
}

describe("StudentProgramTopicView", () => {
  beforeEach(() => mocks.useQuery.mockReset());

  it("renders breadcrumbs, safe topic content, ordered materials and cross-module navigation", () => {
    mockQueries();

    const { container } = render(<StudentProgramTopicView studentProgramId="program-1" topicId="topic-current" />);

    const breadcrumbs = screen.getByRole("navigation", { name: "Хлебные крошки" });
    expect(breadcrumbs).toHaveTextContent("Мои программы/Python с нуля/Основы/Переменные");
    expect(screen.getByRole("heading", { level: 1, name: "Переменные" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Что изучим" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Учебные материалы" })).toBeInTheDocument();

    const content = container.textContent ?? "";
    expect(content.indexOf("Сначала в ответе API")).toBeLessThan(content.indexOf("Затем в ответе API"));
    expect(container.querySelector("pre code")).toHaveTextContent("value = 1");
    expect(screen.getByRole("link", { name: /Предыдущая тема\s*Введение/ })).toHaveAttribute(
      "href",
      "/student/programs/program-1/topics/topic-before",
    );
    expect(screen.getByRole("link", { name: /Следующая тема\s*Условия/ })).toHaveAttribute(
      "href",
      "/student/programs/program-1/topics/topic-after",
    );
    expect(screen.queryByRole("button", { name: /редактировать|удалить|переместить/i })).not.toBeInTheDocument();
  });

  it("does not expose storage identifiers or a teacher-only file URL", () => {
    mockQueries();
    render(<StudentProgramTopicView studentProgramId="program-1" topicId="topic-current" />);

    expect(screen.getByText("Файл пока недоступен для скачивания.")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Скачать файл" })).not.toBeInTheDocument();
    expect(document.body.innerHTML).not.toContain("/api/v1/teacher/topics/");
    expect(screen.queryByText("private-file-key-must-not-appear")).not.toBeInTheDocument();
  });

  it("renders loading and empty-material states", () => {
    const pending = {
      data: undefined,
      error: null,
      isPending: true,
      isError: false,
      isSuccess: false,
      refetch: vi.fn(),
    };
    mockQueries(pending);
    const { rerender } = render(<StudentProgramTopicView studentProgramId="program-1" topicId="topic-current" />);
    expect(screen.getByText("Загружаем тему…")).toHaveAttribute("aria-busy", "true");

    mockQueries(queryState({ ...topic, materials: [] }));
    rerender(<StudentProgramTopicView studentProgramId="program-1" topicId="topic-current" />);
    expect(screen.getByText("Для этой темы пока нет материалов.")).toBeInTheDocument();
  });

  it.each([
    [403, "Нет доступа к теме"],
    [404, "Тема не найдена"],
  ])("renders a dedicated %s error", (status, title) => {
    mockQueries({
      data: undefined,
      error: apiError(status),
      isPending: false,
      isError: true,
      isSuccess: false,
      refetch: vi.fn(),
    });
    render(<StudentProgramTopicView studentProgramId="program-1" topicId="topic-current" />);

    expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Повторить" })).not.toBeInTheDocument();
  });

  it("retries both requests after a transient error", () => {
    const topicRefetch = vi.fn();
    const programRefetch = vi.fn();
    mockQueries(
      {
        data: undefined,
        error: new Error("network"),
        isPending: false,
        isError: true,
        isSuccess: false,
        refetch: topicRefetch,
      },
      { ...queryState(program), refetch: programRefetch },
    );
    render(<StudentProgramTopicView studentProgramId="program-1" topicId="topic-current" />);
    fireEvent.click(screen.getByRole("button", { name: "Повторить" }));

    expect(topicRefetch).toHaveBeenCalledOnce();
    expect(programRefetch).toHaveBeenCalledOnce();
  });

  it("renders ordered practice tasks and opens the selected standalone solution", () => {
    mockQueries(
      queryState(topic),
      queryState(program),
      queryState([
        {
          id: "task-second",
          title: "Второе задание",
          descriptionMarkdown: "Описание",
          taskType: "CODE",
          difficulty: "EASY",
          position: 20,
          required: false,
          programmingConfig: { language: "PYTHON", starterCode: "print(2)", executionEnabled: true },
        },
        {
          id: "task-first",
          title: "Первое задание",
          descriptionMarkdown: "Описание",
          taskType: "CODE",
          difficulty: "EASY",
          position: 10,
          required: true,
          programmingConfig: { language: "PYTHON", starterCode: "print(1)", executionEnabled: true },
        },
      ]),
    );

    render(<StudentProgramTopicView studentProgramId="program-1" topicId="topic-current" />);

    const practice = screen.getByRole("heading", { name: "Практические задания" }).closest("section");
    expect(practice).not.toBeNull();
    expect(practice!.textContent!.indexOf("Первое задание")).toBeLessThan(
      practice!.textContent!.indexOf("Второе задание"),
    );

    fireEvent.click(screen.getAllByRole("button", { name: /Решить/ })[0]);

    expect(screen.getByTestId("practice-solution")).toHaveTextContent("program-1/topic-current/Первое задание");
  });
});
