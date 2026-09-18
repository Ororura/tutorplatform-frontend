import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TeacherProgramsView } from "./teacher-programs-view";

const mocks = vi.hoisted(() => ({
  useQuery: vi.fn(),
  list: vi.fn(() => ({
    queryKey: ["learning-programs", "list", "ALL"],
  })),
  refetch: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: mocks.useQuery,
}));

vi.mock("@/entities/learning-program", () => ({
  learningProgramQueries: {
    list: mocks.list,
  },
}));

vi.mock("@/features/program/create", () => ({
  CreateLearningProgramDialog: () => <button type="button">Создать программу</button>,
}));

vi.mock("@/features/program/activate", () => ({
  ActivateLearningProgramButton: ({ programId }: { programId: string }) => (
    <button type="button">Активировать {programId}</button>
  ),
}));

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

const programs = [
  {
    id: "draft-program",
    subject: {
      id: "subject-1",
      name: "Python",
    },
    title: "Python с нуля",
    description: "Базовая программа",
    status: "DRAFT",
    createdAt: "2026-09-18T00:00:00Z",
    updatedAt: "2026-09-18T00:00:00Z",
  },
  {
    id: "active-program",
    subject: {
      id: "subject-1",
      name: "Python",
    },
    title: "Python Advanced",
    description: "Продвинутая программа",
    status: "ACTIVE",
    createdAt: "2026-09-18T00:00:00Z",
    updatedAt: "2026-09-18T00:00:00Z",
  },
];

describe("TeacherProgramsView", () => {
  beforeEach(() => {
    mocks.list.mockClear();
    mocks.refetch.mockReset();

    mocks.useQuery.mockReturnValue({
      data: programs,
      isPending: false,
      isError: false,
      isFetching: false,
      refetch: mocks.refetch,
    });
  });

  it("requests all teacher programs", () => {
    render(<TeacherProgramsView />);

    expect(mocks.list).toHaveBeenCalledWith();
  });

  it("renders teacher programs and create action", () => {
    render(<TeacherProgramsView />);

    expect(
      screen.getByRole("heading", {
        name: "Программы обучения",
      }),
    ).toBeInTheDocument();

    expect(screen.getByText("Python с нуля")).toBeInTheDocument();
    expect(screen.getByText("Python Advanced")).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Создать программу",
      }),
    ).toBeInTheDocument();
  });

  it("allows activation only for draft program", () => {
    render(<TeacherProgramsView />);

    expect(
      screen.getByRole("button", {
        name: "Активировать draft-program",
      }),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "Активировать active-program",
      }),
    ).not.toBeInTheDocument();
  });

  it("explains that draft cannot yet be assigned", () => {
    render(<TeacherProgramsView />);

    expect(screen.getByText("Черновик нельзя назначить ученику. Сначала активируйте программу.")).toBeInTheDocument();
  });

  it("renders empty state", () => {
    mocks.useQuery.mockReturnValue({
      data: [],
      isPending: false,
      isError: false,
      isFetching: false,
      refetch: mocks.refetch,
    });

    render(<TeacherProgramsView />);

    expect(screen.getByText("Программ пока нет")).toBeInTheDocument();
  });

  it("allows retry after loading error", () => {
    mocks.useQuery.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      isFetching: false,
      refetch: mocks.refetch,
    });

    render(<TeacherProgramsView />);

    expect(screen.getByText("Не удалось загрузить программы.")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Повторить",
      }),
    );

    expect(mocks.refetch).toHaveBeenCalled();
  });
});
