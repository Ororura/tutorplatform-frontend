import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiClientError } from "@/shared/api/client";

import { StudentProgramDetailView } from "./student-program-detail-view";

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
  learningProgramId: "learning-program-1",
  title: "Python с нуля",
  description: "Практическая программа для начинающих",
  status: "ACTIVE" as const,
  reportIntervalMinutes: 60,
  startedAt: "2026-09-01T00:00:00Z",
  completedAt: null,
  subject: { id: "subject-1", name: "Программирование", code: "PROGRAMMING" },
  modules: [
    {
      id: "module-second-by-position",
      title: "Сначала по ответу API",
      description: "Первый отображаемый модуль",
      position: 10,
      topics: [
        {
          id: "topic-b",
          title: "Первая тема из ответа",
          description: null,
          position: 20,
          topicStatus: "ACTIVE" as const,
          progressStatus: "IN_PROGRESS" as const,
        },
        {
          id: "topic-a",
          title: "Вторая тема из ответа",
          description: null,
          position: 10,
          topicStatus: "ACTIVE" as const,
          progressStatus: null,
        },
      ],
    },
    {
      id: "module-first-by-position",
      title: "Затем по ответу API",
      description: null,
      position: 1,
      topics: [],
    },
  ],
};

function apiError(status: number) {
  return new ApiClientError(status, {
    code: status === 403 ? "FORBIDDEN" : "NOT_FOUND",
    message: "error",
    timestamp: "2026-09-21T00:00:00Z",
    traceId: "trace",
    details: [],
  });
}

describe("StudentProgramDetailView", () => {
  beforeEach(() => mocks.useQuery.mockReset());

  it("renders program modules and topics in API order with student topic links", () => {
    mocks.useQuery.mockReturnValue({
      data: program,
      error: null,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<StudentProgramDetailView studentProgramId="program-1" />);

    expect(screen.getByRole("heading", { level: 1, name: "Python с нуля" })).toBeInTheDocument();
    expect(screen.getByText("Программирование")).toBeInTheDocument();
    expect(screen.getByText("Практическая программа для начинающих")).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent)).toEqual([
      "Сначала по ответу API",
      "Затем по ответу API",
    ]);

    const topicLinks = screen.getAllByRole("link", { name: /тема из ответа/ });
    expect(topicLinks.map((link) => link.textContent)).toEqual([
      expect.stringContaining("Первая тема из ответа"),
      expect.stringContaining("Вторая тема из ответа"),
    ]);
    expect(topicLinks[0]).toHaveAttribute("href", "/student/programs/program-1/topics/topic-b");
    expect(topicLinks[1]).toHaveAttribute("href", "/student/programs/program-1/topics/topic-a");
    expect(screen.getByText("В процессе")).toBeInTheDocument();
    expect(screen.queryByText("Статус не задан")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /редактировать|назначить|архивировать/i })).not.toBeInTheDocument();
  });

  it("renders a loading state", () => {
    mocks.useQuery.mockReturnValue({
      data: undefined,
      error: null,
      isPending: true,
      isError: false,
      refetch: vi.fn(),
    });

    render(<StudentProgramDetailView studentProgramId="program-1" />);

    expect(screen.getByText("Загружаем программу…")).toHaveAttribute("aria-busy", "true");
  });

  it.each([
    [403, "Нет доступа к программе"],
    [404, "Программа не найдена"],
  ])("renders a dedicated %s error without retry", (status, title) => {
    mocks.useQuery.mockReturnValue({
      data: undefined,
      error: apiError(status),
      isPending: false,
      isError: true,
      refetch: vi.fn(),
    });

    render(<StudentProgramDetailView studentProgramId="program-1" />);

    expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Повторить" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Вернуться к программам" })).toHaveAttribute("href", "/student/programs");
  });

  it("offers retry after a loading failure", () => {
    const refetch = vi.fn();
    mocks.useQuery.mockReturnValue({
      data: undefined,
      error: new Error("network"),
      isPending: false,
      isError: true,
      refetch,
    });

    render(<StudentProgramDetailView studentProgramId="program-1" />);
    fireEvent.click(screen.getByRole("button", { name: "Повторить" }));

    expect(refetch).toHaveBeenCalledOnce();
  });
});
