import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TeacherStudentProgramView } from "./teacher-student-program-view";

const mocks = vi.hoisted(() => ({ useQuery: vi.fn(), replace: vi.fn() }));

vi.mock("@tanstack/react-query", () => ({ useQuery: mocks.useQuery, queryOptions: (options: unknown) => options }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: mocks.replace }) }));
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
vi.mock("@/features/program/assign", () => ({
  AssignLearningProgramDialog: ({ triggerLabel }: { triggerLabel: string }) => <button>{triggerLabel}</button>,
}));

const program = (id: string, title: string) => ({
  id,
  learningProgramId: `learning-${id}`,
  title,
  status: "ACTIVE" as const,
  reportIntervalMinutes: 60,
  startedAt: "2026-09-01T00:00:00Z",
  subject: { id: "subject-1", name: "Python" },
});

function queryResult(overrides: Record<string, unknown> = {}) {
  return { isPending: false, isError: false, data: [], error: null, refetch: vi.fn(), ...overrides };
}

describe("TeacherStudentProgramView", () => {
  beforeEach(() => {
    mocks.useQuery.mockReset();
    mocks.replace.mockReset();
  });

  it("shows list loading without an empty state", () => {
    mocks.useQuery.mockReturnValue(queryResult({ isPending: true, data: undefined }));
    render(<TeacherStudentProgramView studentId="student-1" />);
    expect(screen.getByText("Загружаем программы…")).toBeInTheDocument();
    expect(screen.queryByText("У ученика пока нет программы обучения")).not.toBeInTheDocument();
  });

  it("shows a clean empty state", () => {
    mocks.useQuery.mockReturnValue(queryResult());
    render(<TeacherStudentProgramView studentId="student-1" />);
    expect(screen.getByText("У ученика пока нет программы обучения")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Назначить программу" })).toBeInTheDocument();
  });

  it("keeps the program overview accessible when the student has one program", () => {
    mocks.useQuery.mockReturnValue(
      queryResult({
        data: [program("program-1", "Python с нуля")],
      }),
    );

    render(<TeacherStudentProgramView studentId="student-1" />);

    expect(mocks.replace).not.toHaveBeenCalled();

    expect(
      screen.getByRole("link", {
        name: /Python с нуля/,
      }),
    ).toHaveAttribute("href", "/teacher/students/student-1/programs/program-1");

    expect(
      screen.getByRole("button", {
        name: "Назначить ещё программу",
      }),
    ).toBeInTheDocument();
  });

  it("renders a compact selector for multiple programs", () => {
    mocks.useQuery.mockReturnValue(
      queryResult({ data: [program("program-1", "Python с нуля"), program("program-2", "Алгоритмы")] }),
    );
    render(<TeacherStudentProgramView studentId="student-1" />);
    expect(screen.getByRole("heading", { name: "Выберите программу" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Алгоритмы/ })).toHaveAttribute(
      "href",
      "/teacher/students/student-1/programs/program-2",
    );
    expect(screen.getByRole("button", { name: "Назначить ещё программу" })).toBeInTheDocument();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it("shows an API error with retry", () => {
    mocks.useQuery.mockReturnValue(queryResult({ isError: true, data: undefined, error: new Error("network") }));
    render(<TeacherStudentProgramView studentId="student-1" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Не удалось загрузить программы ученика.");
    expect(screen.getByRole("button", { name: "Повторить" })).toBeInTheDocument();
  });

  it("changes the query key when switching students", () => {
    mocks.useQuery.mockReturnValue(queryResult());
    const { rerender } = render(<TeacherStudentProgramView studentId="student-alex" />);
    rerender(<TeacherStudentProgramView studentId="student-maria" />);
    expect(mocks.useQuery.mock.calls[0][0].queryKey).toContain("student-alex");
    expect(mocks.useQuery.mock.calls.at(-1)?.[0].queryKey).toContain("student-maria");
  });
});
