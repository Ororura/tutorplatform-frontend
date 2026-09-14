import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { StudentProgramDetails } from "../api/student-program-queries";
import { StudentProgramDetail } from "./student-program-detail";

vi.mock("next/link", () => ({ default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));

const details: StudentProgramDetails = {
  id: "program-1",
  learningProgramId: "learning-1",
  title: "Python с нуля",
  description: "Практическая программа",
  status: "ACTIVE",
  reportIntervalMinutes: 60,
  startedAt: "2026-09-01T00:00:00Z",
  subject: { id: "subject-1", name: "Программирование", code: "PROGRAMMING" },
  modules: [
    {
      id: "module-2",
      title: "Второй по API",
      position: 20,
      topics: [
        { id: "topic-2", title: "Вторая тема по API", position: 20, topicStatus: "ACTIVE", progressStatus: "IN_PROGRESS" },
        { id: "topic-1", title: "Первая тема по API", position: 10, topicStatus: "ACTIVE", progressStatus: "COMPLETED" },
      ],
    },
    {
      id: "module-1",
      title: "Первый по API",
      position: 10,
      topics: [
        { id: "topic-3", title: "Доступная тема", position: 1, topicStatus: "ACTIVE", progressStatus: "AVAILABLE" },
        { id: "topic-4", title: "Закрытая тема", position: 2, topicStatus: "ACTIVE", progressStatus: "LOCKED" },
        { id: "topic-5", title: "Без статуса", position: 3, topicStatus: "ACTIVE" },
      ],
    },
  ],
};

describe("StudentProgramDetail", () => {
  it("renders program metadata, modules and topics in server order", () => {
    const { container } = render(<StudentProgramDetail program={details} studentId="student-1" />);

    expect(screen.getByRole("heading", { name: "Python с нуля" })).toBeInTheDocument();
    expect(screen.getByText("Программирование")).toBeInTheDocument();
    const text = container.textContent ?? "";
    expect(text.indexOf("Второй по API")).toBeLessThan(text.indexOf("Первый по API"));
    expect(text.indexOf("Вторая тема по API")).toBeLessThan(text.indexOf("Первая тема по API"));
  });

  it.each([
    ["Пройдена"],
    ["В процессе"],
    ["Доступна"],
    ["Заблокирована"],
    ["Статус не задан"],
  ])("renders the centralized progress mapping: %s", (label) => {
    render(<StudentProgramDetail program={details} studentId="student-1" />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("opens a topic with complete student and program context", () => {
    render(<StudentProgramDetail program={details} studentId="student-1" />);
    expect(screen.getByRole("link", { name: /Доступная тема/ })).toHaveAttribute(
      "href",
      "/teacher/students/student-1/programs/program-1/topics/topic-3",
    );
  });
});
