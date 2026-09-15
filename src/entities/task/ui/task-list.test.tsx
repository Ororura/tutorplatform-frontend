import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Task } from "../api/task-queries";
import { TaskList } from "./task-list";

vi.mock("next/link", () => ({ default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => <a href={href} {...props}>{children}</a> }));
const base = { subjectId: "subject-1", descriptionMarkdown: "Description", version: 0, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" };

describe("TaskList", () => {
  it("renders TEXT/CODE, every difficulty/status mapping, subject and detail links", () => {
    const tasks: Task[] = [
      { ...base, id: "one", title: "Text easy", taskType: "TEXT", difficulty: "EASY", status: "DRAFT" },
      { ...base, id: "two", title: "Code medium", taskType: "CODE", difficulty: "MEDIUM", status: "ACTIVE" },
      { ...base, id: "three", title: "Text hard", taskType: "TEXT", difficulty: "HARD", status: "ARCHIVED" },
    ];
    render(<TaskList tasks={tasks} subjects={[{ id: "subject-1", name: "Python", status: "ACTIVE" }]} />);
    expect(screen.getAllByText("Текстовый ответ")).toHaveLength(2);
    expect(screen.getByText("Код")).toBeInTheDocument();
    ["Лёгкая", "Средняя", "Сложная", "Черновик", "Активно", "В архиве"].forEach((label) => expect(screen.getByText(label)).toBeInTheDocument());
    expect(screen.getAllByText("Python")).toHaveLength(3);
    expect(screen.getByRole("link", { name: /Code medium/ })).toHaveAttribute("href", "/teacher/tasks/two");
  });
});
