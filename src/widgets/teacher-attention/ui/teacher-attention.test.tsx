import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { TeacherDashboardAttentionItem } from "@/entities/dashboard";

import { TeacherAttention } from "./teacher-attention";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const items: TeacherDashboardAttentionItem[] = [
  {
    type: "SUBMISSION_NEEDS_REVIEW",
    studentId: "student-1",
    displayName: "Анна Смирнова",
    resourceId: "submission-1",
    eventAt: "2026-09-21T12:30:00Z",
    navigation: {
      studentProgramId: "student-program-1",
      homeworkId: "homework-1",
      homeworkItemId: "homework-item-1",
      taskId: "task-1",
      submissionId: "submission-1",
    },
  },
  {
    type: "HOMEWORK_OVERDUE",
    studentId: "student-2",
    displayName: "Борис Петров",
    resourceId: "homework-2",
    eventAt: "2026-09-20T10:00:00Z",
    navigation: { studentProgramId: "student-program-2", homeworkId: "homework-2" },
  },
  {
    type: "LEARNING_PERIOD_REPORT_MISSING",
    studentId: "student-3",
    displayName: "Мария Орлова",
    resourceId: "period-1",
    eventAt: "2026-09-19T09:00:00Z",
    navigation: { studentProgramId: "student-program-3", learningPeriodId: "period-1", reportId: "report-1" },
  },
];

describe("TeacherAttention", () => {
  it("shows the empty state from real dashboard data", () => {
    render(<TeacherAttention items={[]} />);

    expect(screen.getByText("Всё спокойно")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Рабочая очередь" }).closest("section")).toHaveAttribute(
      "id",
      "teacher-attention",
    );
  });

  it("links every attention item to its corresponding resource", () => {
    render(<TeacherAttention items={items} />);

    expect(screen.getByRole("heading", { name: "Рабочая очередь" })).toBeInTheDocument();
    expect(screen.queryByText("Всё спокойно")).not.toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(items.length);

    expect(screen.getByRole("link", { name: /Анна Смирнова.*Работа ожидает проверки/ })).toHaveAttribute(
      "href",
      "/teacher/students/student-1/submissions/submission-1",
    );
    expect(screen.getByRole("link", { name: /Борис Петров.*Просрочено домашнее задание/ })).toHaveAttribute(
      "href",
      "/teacher/students/student-2/homework/homework-2",
    );
    expect(screen.getByRole("link", { name: /Мария Орлова.*Отчётный период готов/ })).toHaveAttribute(
      "href",
      "/teacher/students/student-3/reports/report-1",
    );
  });

  it("opens the correct program and completed period when there is no report", () => {
    render(
      <TeacherAttention
        items={[{ ...items[2], navigation: { studentProgramId: "program-2", learningPeriodId: "period-2" } }]}
      />,
    );
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/teacher/students/student-3/reports?studentProgramId=program-2&learningPeriodId=period-2#learning-period-period-2",
    );
  });
  it("filters categories and dispatches the server filter", () => {
    const change = vi.fn();
    render(<TeacherAttention items={items} filter="HOMEWORK_OVERDUE" onFilterChange={change} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Просрочено" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "На проверку" }));
    expect(change).toHaveBeenCalledWith("SUBMISSION_NEEDS_REVIEW");
  });
  it("sorts by category then oldest first without changing input", () => {
    const newer = { ...items[0], resourceId: "newer", displayName: "Новая работа", eventAt: "2026-10-01T10:00:00Z" };
    const unordered = [items[2], newer, items[1], items[0]];
    render(<TeacherAttention items={unordered} />);
    const rows = screen.getAllByRole("listitem");
    expect(rows[0]).toHaveTextContent("Анна Смирнова");
    expect(rows[1]).toHaveTextContent("Новая работа");
    expect(rows[2]).toHaveTextContent("Борис Петров");
    expect(unordered[0]).toBe(items[2]);
  });
  it("lets the teacher recover when the last page empties after a queue refresh", () => {
    const change = vi.fn();
    render(<TeacherAttention items={[]} page={1} totalPages={1} totalElements={20} onPageChange={change} />);
    expect(screen.getByText("На этой странице больше нет задач")).toBeInTheDocument();
    expect(screen.queryByText("Всё спокойно")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "К началу очереди" }));
    expect(change).toHaveBeenCalledWith(0);
  });
  it("shows loading, error and retry without stale actions", () => {
    const retry = vi.fn();
    const view = render(<TeacherAttention items={items} isPending />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    view.rerender(<TeacherAttention items={items} isError onRetry={retry} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Не удалось загрузить рабочую очередь");
    fireEvent.click(screen.getByRole("button", { name: "Повторить" }));
    expect(retry).toHaveBeenCalledOnce();
  });
});
