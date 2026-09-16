import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { StudentPage } from "@/entities/student";

import { StudentListState } from "./student-list-state";

const emptyPage: StudentPage = {
  items: [],
  page: 0,
  size: 20,
  totalElements: 0,
  totalPages: 0,
};

describe("StudentListState", () => {
  it("renders loading state", () => {
    render(<StudentListState isPending isError={false} onRetry={vi.fn()} />);
    expect(screen.getByText("Загружаем учеников…")).toHaveAttribute("aria-busy", "true");
  });

  it("renders an actionable error state", () => {
    const onRetry = vi.fn();
    render(<StudentListState isPending={false} isError onRetry={onRetry} />);
    fireEvent.click(screen.getByRole("button", { name: "Повторить" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("renders empty state", () => {
    render(<StudentListState isPending={false} isError={false} data={emptyPage} onRetry={vi.fn()} />);
    expect(screen.getByText("У вас пока нет учеников")).toBeInTheDocument();
  });

  it("distinguishes an empty search result", () => {
    render(<StudentListState isPending={false} isError={false} data={emptyPage} hasActiveFilters onRetry={vi.fn()} />);
    expect(screen.getByText("Ученики не найдены")).toBeInTheDocument();
  });

  it("renders students with a detail link", () => {
    render(
      <StudentListState
        isPending={false}
        isError={false}
        onRetry={vi.fn()}
        data={{
          ...emptyPage,
          items: [
            {
              id: "student-1",
              firstName: "Анна",
              lastName: "Иванова",
              status: "ACTIVE",
              accountStatus: "INVITED",
              createdAt: "2026-09-07T08:00:00Z",
            },
          ],
          totalElements: 1,
          totalPages: 1,
        }}
      />,
    );
    expect(screen.getByRole("link", { name: /Анна Иванова/ })).toHaveAttribute("href", "/teacher/students/student-1");
    expect(screen.getByText("Приглашён")).toBeInTheDocument();
  });

  it("renders the registered account presentation separately from student status", () => {
    render(
      <StudentListState
        isPending={false}
        isError={false}
        onRetry={vi.fn()}
        data={{
          ...emptyPage,
          items: [
            {
              id: "student-2",
              firstName: "Алексей",
              lastName: "Иванов",
              status: "ACTIVE",
              accountStatus: "REGISTERED",
              createdAt: "2026-09-07T08:00:00Z",
            },
          ],
          totalElements: 1,
          totalPages: 1,
        }}
      />,
    );
    expect(screen.getByText("Зарегистрирован")).toBeInTheDocument();
    expect(screen.getByText("Активен")).toBeInTheDocument();
  });
});
