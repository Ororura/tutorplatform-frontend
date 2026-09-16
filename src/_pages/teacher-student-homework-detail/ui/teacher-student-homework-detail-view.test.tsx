import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TeacherStudentHomeworkDetailView } from "./teacher-student-homework-detail-view";

const mocks = vi.hoisted(() => ({ useQuery: vi.fn(), cancel: vi.fn(), confirm: vi.fn() }));
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
vi.mock("@/features/homework/cancel", () => ({
  useCancelHomeworkMutation: () => ({
    mutateAsync: mocks.cancel,
    isPending: false,
  }),
}));

const details = {
  id: "hw-1",
  studentProgramId: "p1",
  title: "Практика",
  description: "Описание",
  status: "ASSIGNED",
  assignedAt: "2026-09-10T10:00:00Z",
  overdue: true,
  items: [
    { id: "two", taskId: "task-code", taskTitle: "Код", position: 1, required: false },
    {
      id: "one",
      taskId: "task-text",
      taskTitle: "Текст",
      position: 0,
      required: true,
    },
  ],
  version: 1,
  createdAt: "2026-09-10T10:00:00Z",
  updatedAt: "2026-09-10T10:00:00Z",
};

describe("TeacherStudentHomeworkDetailView", () => {
  beforeEach(() => {
    mocks.cancel.mockReset().mockResolvedValue({ ...details, status: "CANCELLED" });
    mocks.confirm.mockReset().mockReturnValue(true);
    vi.stubGlobal("confirm", mocks.confirm);
    mocks.useQuery.mockImplementation((options?: { queryKey?: unknown[] }) =>
      options?.queryKey?.includes("student-programs")
        ? {
            data: [
              {
                id: "p1",
                title: "Python",
                subject: { name: "Информатика" },
              },
            ],
          }
        : { data: details, isPending: false, isError: false },
    );
  });
  it("renders nullable dates, backend overdue, ordered items, required flags and task links", () => {
    render(<TeacherStudentHomeworkDetailView studentId="alex" homeworkId="hw-1" />);
    expect(screen.getByText("Просрочено")).toBeInTheDocument();
    expect(screen.getByText("Без срока")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")[0]).toHaveTextContent("Текст");
    expect(screen.getByText("Необязательное")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Код" })).toHaveAttribute("href", "/teacher/tasks/task-code");
  });
  it("offers cancel for ASSIGNED homework", () => {
    render(<TeacherStudentHomeworkDetailView studentId="alex" homeworkId="hw-1" />);
    fireEvent.click(screen.getByRole("button", { name: "Отменить домашнее задание" }));
    expect(mocks.cancel).toHaveBeenCalled();
  });
});
