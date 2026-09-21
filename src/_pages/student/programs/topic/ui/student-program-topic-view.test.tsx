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
  refetch: ReturnType<typeof vi.fn>;
};

function queryState(data: unknown): QueryState {
  return { data, error: null, isPending: false, isError: false, refetch: vi.fn() };
}

function mockQueries(topicState: QueryState = queryState(topic), programState: QueryState = queryState(program)) {
  mocks.useQuery.mockImplementation((options: { queryKey: readonly unknown[] }) =>
    options?.queryKey?.includes("topic") ? topicState : programState,
  );
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
    const pending = { data: undefined, error: null, isPending: true, isError: false, refetch: vi.fn() };
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
    mockQueries({ data: undefined, error: apiError(status), isPending: false, isError: true, refetch: vi.fn() });
    render(<StudentProgramTopicView studentProgramId="program-1" topicId="topic-current" />);

    expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Повторить" })).not.toBeInTheDocument();
  });

  it("retries both requests after a transient error", () => {
    const topicRefetch = vi.fn();
    const programRefetch = vi.fn();
    mockQueries(
      { data: undefined, error: new Error("network"), isPending: false, isError: true, refetch: topicRefetch },
      { ...queryState(program), refetch: programRefetch },
    );
    render(<StudentProgramTopicView studentProgramId="program-1" topicId="topic-current" />);
    fireEvent.click(screen.getByRole("button", { name: "Повторить" }));

    expect(topicRefetch).toHaveBeenCalledOnce();
    expect(programRefetch).toHaveBeenCalledOnce();
  });
});
