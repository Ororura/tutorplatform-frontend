import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SessionList } from "./session-list";

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

const base = {
  studentProgramId: "program-1",
  startedAt: "2026-09-14T13:30:00Z",
  durationMinutes: 60,
  summary: "Разобрали переменные",
  topics: [{ topicId: "topic-1", isPrimary: true }],
  createdAt: "2026-09-14T13:30:00Z",
  updatedAt: "2026-09-14T13:30:00Z",
  version: 0,
};

describe("SessionList", () => {
  it("renders all attendance states, summary, duration and a detail link", () => {
    render(
      <SessionList
        studentId="student-1"
        sessions={[
          { ...base, id: "one", attendanceStatus: "ATTENDED" },
          { ...base, id: "two", attendanceStatus: "MISSED" },
          { ...base, id: "three", attendanceStatus: "CANCELLED" },
        ]}
      />,
    );
    expect(screen.getByText("Проведено")).toBeInTheDocument();
    expect(screen.getByText("Пропущено")).toBeInTheDocument();
    expect(screen.getByText("Отменено")).toBeInTheDocument();
    expect(screen.getAllByText("60 мин · Тем: 1")).toHaveLength(3);
    expect(screen.getAllByText("Разобрали переменные")).toHaveLength(3);
    expect(screen.getAllByRole("link")[0]).toHaveAttribute("href", "/teacher/students/student-1/sessions/one");
  });
});
