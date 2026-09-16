import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { HomeworkSummary } from "../api/homework-queries";
import { HomeworkList } from "./homework-list";

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
const base = { studentProgramId: "program-1", assignedAt: "2026-09-14T10:00:00Z", createdAt: "2026-09-14T10:00:00Z" };

describe("HomeworkList", () => {
  it("renders persisted states plus backend-derived overdue and detail links", () => {
    const homeworks: HomeworkSummary[] = [
      { ...base, id: "assigned", title: "Будущее", status: "ASSIGNED", overdue: false },
      { ...base, id: "overdue", title: "Прошлое", status: "ASSIGNED", overdue: true },
      { ...base, id: "done", title: "Готово", status: "COMPLETED", overdue: false },
      { ...base, id: "cancelled", title: "Отмена", status: "CANCELLED", overdue: false },
    ];
    render(<HomeworkList homeworks={homeworks} studentId="alex" />);
    ["Назначено", "Просрочено", "Выполнено", "Отменено"].forEach((label) =>
      expect(screen.getByText(label)).toBeInTheDocument(),
    );
    expect(screen.getByRole("link", { name: /Прошлое/ })).toHaveAttribute(
      "href",
      "/teacher/students/alex/homework/overdue",
    );
    expect(screen.getAllByText(/14 сентября 2026/).length).toBeGreaterThan(0);
  });
});
