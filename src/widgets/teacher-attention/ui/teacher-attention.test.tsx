import { render, screen } from "@testing-library/react";
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

    expect(screen.getByRole("heading", { name: "Требует внимания" })).toBeInTheDocument();
    expect(screen.getByText("Сейчас нет работ и отчётов, требующих действий.")).toBeInTheDocument();
  });

  it("links every attention item to its corresponding resource", () => {
    render(<TeacherAttention items={items} />);

    expect(screen.getByRole("link", { name: /Работа ожидает проверки.*Анна Смирнова/ })).toHaveAttribute(
      "href",
      "/teacher/students/student-1/homework/homework-1",
    );
    expect(screen.getByRole("link", { name: /Просрочено домашнее задание.*Борис Петров/ })).toHaveAttribute(
      "href",
      "/teacher/students/student-2/homework/homework-2",
    );
    expect(screen.getByRole("link", { name: /Отчётный период готов.*Мария Орлова/ })).toHaveAttribute(
      "href",
      "/teacher/students/student-3/reports/report-1",
    );
  });
});
