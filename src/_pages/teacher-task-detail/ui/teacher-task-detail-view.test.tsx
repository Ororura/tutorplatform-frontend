import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TeacherTaskDetailView } from "./teacher-task-detail-view";

const mocks = vi.hoisted(() => ({ useQuery: vi.fn() }));
vi.mock("@tanstack/react-query", () => ({ useQuery: mocks.useQuery, queryOptions: (value: unknown) => value }));
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
vi.mock("@/features/task/edit", () => ({ EditTaskDialog: () => <button>Редактировать</button> }));

const task = {
  id: "task-1",
  subjectId: "subject-1",
  title: "Сумма",
  descriptionMarkdown: "# Условие\n[опасная ссылка](javascript:alert(1))",
  taskType: "CODE",
  difficulty: "HARD",
  status: "ACTIVE",
  version: 0,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  programmingConfig: {
    language: "PYTHON",
    starterCode: "a = int(input())",
    executionEnabled: true,
    timeLimitMs: 5000,
    memoryLimitMb: 128,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  testCases: [
    {
      id: "hidden",
      inputText: "2 3",
      expectedOutput: "5",
      hidden: true,
      comparisonMode: "NORMALIZED",
      position: 1,
      createdAt: "2026-01-01T00:00:00Z",
    },
    {
      id: "open",
      expectedOutput: "0",
      hidden: false,
      comparisonMode: "EXACT",
      position: 0,
      createdAt: "2026-01-01T00:00:00Z",
    },
  ],
};

describe("TeacherTaskDetailView", () => {
  beforeEach(() => mocks.useQuery.mockReset());
  it("renders safe markdown, CODE configuration and ordered teacher-visible tests", () => {
    mocks.useQuery.mockImplementation((options?: { queryKey?: unknown[] }) =>
      options?.queryKey?.includes("subjects")
        ? { data: [{ id: "subject-1", name: "Python" }] }
        : {
            data: task,
            isPending: false,
            isError: false,
          },
    );
    render(<TeacherTaskDetailView taskId="task-1" />);
    expect(screen.getByRole("heading", { name: "Условие" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "опасная ссылка" })).not.toBeInTheDocument();
    expect(screen.getByText("a = int(input())")).toBeInTheDocument();
    expect(screen.getByText("Скрытый · NORMALIZED")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")[0]).toHaveTextContent("Открытый · EXACT");
  });
});
