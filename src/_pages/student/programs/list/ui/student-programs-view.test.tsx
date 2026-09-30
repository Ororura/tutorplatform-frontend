import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CurrentProgress } from "@/entities/progress";
import type { StudentProgramDetails, StudentProgramSummary } from "@/entities/student-program";

import { StudentProgramsView } from "./student-programs-view";

const mocks = vi.hoisted(() => ({ useQuery: vi.fn() }));
vi.mock("@tanstack/react-query", () => ({ useQuery: mocks.useQuery, queryOptions: (value: unknown) => value }));

const program: StudentProgramSummary = {
  id: "program-1",
  learningProgramId: "learning-1",
  title: "Python с нуля",
  description: "Практическая программа для начинающих",
  status: "ACTIVE",
  startedAt: "2026-09-01T00:00:00Z",
  reportIntervalMinutes: 60,
  subject: { id: "subject-1", name: "Программирование", code: "PROGRAMMING" },
};
const details: StudentProgramDetails = {
  ...program,
  modules: [
    {
      id: "module-1",
      title: "Управление программой",
      position: 0,
      topics: [{ id: "topic-1", title: "Циклы", position: 0, topicStatus: "ACTIVE", progressStatus: "IN_PROGRESS" }],
    },
  ],
};
let programs: StudentProgramSummary[];
let progress: CurrentProgress | undefined;
let programDetails: StudentProgramDetails | undefined;
let progressError: boolean;
let detailsError: boolean;

function queryResult(data: unknown, isError = false) {
  return { data, isPending: false, isError, refetch: vi.fn() };
}

describe("StudentProgramsView", () => {
  beforeEach(() => {
    programs = [program];
    progress = { totalTopics: 3, topics: { completed: [{ id: "completed" }] } };
    programDetails = details;
    progressError = false;
    detailsError = false;
    mocks.useQuery.mockReset();
    mocks.useQuery.mockImplementation(({ queryKey }: { queryKey: string[] }) => {
      if (queryKey[0] === "progress") return queryResult(progress, progressError);
      if (queryKey[1] === "detail") return queryResult(programDetails, detailsError);
      return queryResult(programs);
    });
  });

  it("prioritizes active programs with real progress and an explicit current topic", () => {
    render(<StudentProgramsView />);
    expect(screen.getByRole("heading", { level: 1, name: "Мои программы" })).toBeVisible();
    const current = screen.getByRole("region", { name: "Текущая программа" });
    expect(within(current).getByRole("heading", { name: program.title })).toBeVisible();
    expect(within(current).getByText("Активна")).toBeVisible();
    expect(within(current).getByText(program.subject.name)).toBeVisible();
    expect(within(current).getByText(program.description!)).toBeVisible();
    expect(within(current).getByText("1 из 3 тем пройдено")).toBeVisible();
    expect(within(current).getByText("33%")).toBeVisible();
    expect(within(current).getByRole("progressbar", { name: `Прогресс: ${program.title}` })).toHaveAttribute(
      "aria-valuenow",
      "33",
    );
    expect(within(current).getByText("Циклы")).toBeVisible();
    expect(within(current).getByText("Управление программой")).toBeVisible();
    expect(within(current).getByRole("link", { name: "Продолжить обучение" })).toHaveAttribute(
      "href",
      "/student/programs/program-1/topics/topic-1",
    );
    expect(screen.queryByText(/Всего программ/)).not.toBeInTheDocument();
    expect(screen.queryByText("Другие программы")).not.toBeInTheDocument();
    expect(screen.queryByText("Больше программ пока нет")).not.toBeInTheDocument();
  });

  it("keeps every ACTIVE program in the current section without choosing a primary one", () => {
    programs = [program, { ...program, id: "program-2", title: "Вторая активная программа" }];
    render(<StudentProgramsView />);
    expect(within(screen.getByRole("region", { name: "Текущие программы" })).getAllByRole("article")).toHaveLength(2);
    expect(screen.queryByRole("region", { name: "Другие программы" })).not.toBeInTheDocument();
  });

  it.each([
    ["PAUSED", "Приостановлена"],
    ["COMPLETED", "Завершена"],
    ["ARCHIVED", "В архиве"],
  ] as const)("places %s in a compact secondary section", (status, label) => {
    programs = [program, { ...program, id: "other", title: "Другая программа", status }];
    render(<StudentProgramsView />);
    const other = screen.getByRole("region", { name: "Другие программы" });
    expect(within(other).getByText(label)).toBeVisible();
    expect(within(other).getByRole("link", { name: "Открыть: Другая программа" })).toHaveAttribute(
      "href",
      "/student/programs/other",
    );
    expect(within(other).getByText("1 из 3 тем")).toBeVisible();
    expect(within(other).queryByText("Текущая тема")).not.toBeInTheDocument();
    expect(within(other).queryByText(program.description!)).not.toBeInTheDocument();
    expect(mocks.useQuery).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["student-programs", "detail", "current-student", "other"], enabled: false }),
    );
  });

  it("renders secondary programs when there are no active ones", () => {
    programs = [{ ...program, status: "PAUSED" }];
    render(<StudentProgramsView />);
    expect(screen.getByRole("region", { name: "Другие программы" })).toBeVisible();
    expect(screen.queryByText("Текущая программа")).not.toBeInTheDocument();
    expect(screen.queryByText("Пока нет программ")).not.toBeInTheDocument();
  });

  it.each(["AVAILABLE", "LOCKED", "COMPLETED", null] as const)(
    "does not invent a current topic from %s",
    (progressStatus) => {
      programDetails = {
        ...details,
        modules: [{ ...details.modules[0], topics: [{ ...details.modules[0].topics[0], progressStatus }] }],
      };
      render(<StudentProgramsView />);
      expect(screen.queryByText("Текущая тема")).not.toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Открыть программу" })).toHaveAttribute(
        "href",
        "/student/programs/program-1",
      );
    },
  );

  it("does not choose between multiple in-progress topics", () => {
    programDetails = {
      ...details,
      modules: [
        {
          ...details.modules[0],
          topics: [details.modules[0].topics[0], { ...details.modules[0].topics[0], id: "second" }],
        },
      ],
    };
    render(<StudentProgramsView />);
    expect(screen.getByRole("link", { name: "Открыть программу" })).toBeVisible();
  });

  it.each([0, 3])("supports progress at %i completed topics", (completed) => {
    progress = {
      totalTopics: 3,
      topics: { completed: Array.from({ length: completed }, (_, i) => ({ id: String(i) })) },
    };
    render(<StudentProgramsView />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", String((completed / 3) * 100));
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
  });

  it("handles missing optional data and long titles without placeholder content", () => {
    programs = [{ ...program, title: "Очень длинное название программы ".repeat(8), description: null }];
    progress = undefined;
    programDetails = undefined;
    render(<StudentProgramsView />);
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent(programs[0].title.trim());
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Открыть программу" })).toBeVisible();
    expect(screen.queryByText(/Описание программы пока/)).not.toBeInTheDocument();
  });

  it("keeps navigation available when progress and details fail", () => {
    progressError = true;
    detailsError = true;
    render(<StudentProgramsView />);
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.queryByText("Текущая тема")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Открыть программу" })).toBeVisible();
  });

  it("renders a loading state", () => {
    mocks.useQuery.mockReturnValue({ data: undefined, isPending: true, isError: false, refetch: vi.fn() });
    render(<StudentProgramsView />);
    expect(screen.getByText("Загружаем программы…")).toHaveAttribute("aria-busy", "true");
  });

  it("renders the real empty state without a creation action", () => {
    programs = [];
    render(<StudentProgramsView />);
    expect(screen.getByText("Пока нет программ")).toBeVisible();
    expect(screen.getByText("Когда преподаватель назначит программу обучения, она появится здесь.")).toBeVisible();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("offers retry after an API failure", () => {
    const refetch = vi.fn();
    mocks.useQuery.mockReturnValue({ data: undefined, isPending: false, isError: true, refetch });
    render(<StudentProgramsView />);
    fireEvent.click(screen.getByRole("button", { name: "Повторить" }));
    expect(refetch).toHaveBeenCalledOnce();
  });
});
