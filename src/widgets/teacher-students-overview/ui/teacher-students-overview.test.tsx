import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { StudentPage } from "@/entities/student";

import { TeacherStudentsOverview } from "./teacher-students-overview";

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

const studentPage: StudentPage = {
  items: [
    {
      id: "student-1",
      firstName: "Анна",
      lastName: "Смирнова",
      status: "ACTIVE",
      accountStatus: "REGISTERED",
      createdAt: "2026-09-18T10:00:00Z",
    },
    {
      id: "student-2",
      firstName: "Максим",
      lastName: null,
      status: "INACTIVE",
      accountStatus: "UNREGISTERED",
      createdAt: "2026-09-17T10:00:00Z",
    },
  ],
  page: 0,
  size: 6,
  totalElements: 8,
  totalPages: 2,
};

describe("TeacherStudentsOverview", () => {
  it("renders a loading state", () => {
    render(<TeacherStudentsOverview isPending isError={false} onRetry={vi.fn()} />);

    expect(screen.getByText("Загружаем учеников…")).toHaveAttribute("aria-busy", "true");
  });

  it("keeps an error recoverable", () => {
    const retry = vi.fn();

    render(<TeacherStudentsOverview isPending={false} isError onRetry={retry} />);
    fireEvent.click(screen.getByRole("button", { name: "Повторить" }));

    expect(retry).toHaveBeenCalledOnce();
  });

  it("renders the empty state", () => {
    render(
      <TeacherStudentsOverview
        isPending={false}
        isError={false}
        data={{ items: [], page: 0, size: 6, totalElements: 0, totalPages: 0 }}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByText("Учеников пока нет")).toBeInTheDocument();
  });

  it("renders real summaries, nullable names, detail links, and the full-list link", () => {
    render(<TeacherStudentsOverview isPending={false} isError={false} data={studentPage} onRetry={vi.fn()} />);

    expect(screen.getByText("Анна Смирнова")).toBeInTheDocument();
    expect(screen.getByText("Максим")).toBeInTheDocument();
    expect(screen.queryByText(/undefined/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Открыть Анна Смирнова" })).toHaveAttribute(
      "href",
      "/teacher/students/student-1",
    );
    expect(screen.getByRole("link", { name: "Все ученики" })).toHaveAttribute("href", "/teacher/students");
    expect(screen.getByText("Показаны последние 2 из 8")).toBeInTheDocument();
  });
});
