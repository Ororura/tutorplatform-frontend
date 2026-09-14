import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ useQuery: vi.fn() }));

vi.mock("@tanstack/react-query", () => ({ useQuery: mocks.useQuery, queryOptions: (options: unknown) => options }));
vi.mock("next/link", () => ({ default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));

import { TeacherStudentTopicView } from "./teacher-student-topic-view";

const program = {
  id: "program-1",
  learningProgramId: "learning-1",
  title: "Python с нуля",
  status: "ACTIVE" as const,
  reportIntervalMinutes: 60,
  startedAt: "2026-09-01T00:00:00Z",
  subject: { id: "subject-1", name: "Python" },
  modules: [{
    id: "module-1",
    title: "Основы Python",
    position: 1,
    topics: [{ id: "topic-open", title: "Переменные", description: "Описание темы", position: 1, topicStatus: "ACTIVE" as const, progressStatus: "IN_PROGRESS" as const }],
  }],
};

describe("TeacherStudentTopicView", () => {
  beforeEach(() => mocks.useQuery.mockReset());

  it("does not load materials before an open topic is resolved", () => {
    mocks.useQuery
      .mockReturnValueOnce({ isPending: true, isError: false, data: undefined, error: null, refetch: vi.fn() })
      .mockReturnValueOnce({ isPending: true, isError: false, data: undefined, error: null, refetch: vi.fn() });

    render(<TeacherStudentTopicView studentId="student-1" studentProgramId="program-1" topicId="topic-open" />);
    expect(mocks.useQuery.mock.calls[1][0]).toMatchObject({ enabled: false, queryKey: ["topic-materials", "topic-open"] });
  });

  it("loads only the opened topic materials and renders topic context", () => {
    mocks.useQuery
      .mockReturnValueOnce({ isPending: false, isError: false, data: program, error: null, refetch: vi.fn() })
      .mockReturnValueOnce({ isPending: false, isError: false, data: [], error: null, refetch: vi.fn() });

    render(<TeacherStudentTopicView studentId="student-1" studentProgramId="program-1" topicId="topic-open" />);
    expect(mocks.useQuery.mock.calls[0][0].queryKey).toEqual(["student-programs", "detail", "student-1", "program-1"]);
    expect(mocks.useQuery.mock.calls[1][0]).toMatchObject({ enabled: true, queryKey: ["topic-materials", "topic-open"] });
    expect(screen.getByRole("heading", { name: "Переменные" })).toBeInTheDocument();
    expect(screen.getByText(/Основы Python/)).toBeInTheDocument();
    expect(screen.getByText("В процессе")).toBeInTheDocument();
    expect(screen.getByText("Для этой темы пока нет материалов.")).toBeInTheDocument();
  });

  it("shows a safe state when topic is absent from the program", () => {
    mocks.useQuery
      .mockReturnValueOnce({ isPending: false, isError: false, data: program, error: null, refetch: vi.fn() })
      .mockReturnValueOnce({ isPending: true, isError: false, data: undefined, error: null, refetch: vi.fn() });

    render(<TeacherStudentTopicView studentId="student-1" studentProgramId="program-1" topicId="topic-other" />);
    expect(screen.getByRole("heading", { name: "Тема не найдена" })).toBeInTheDocument();
    expect(mocks.useQuery.mock.calls[1][0]).toMatchObject({ enabled: false, queryKey: ["topic-materials", "topic-other"] });
  });
});
