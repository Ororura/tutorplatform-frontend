import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TeacherProgramDetailView } from "./teacher-program-detail-view";

const mocks = vi.hoisted(() => {
  class ApiClientError extends Error {
    constructor(public status: number) {
      super("API error");
    }
  }

  return {
    useQuery: vi.fn(),
    detail: vi.fn((programId: string) => ({ queryKey: ["learning-programs", "detail", programId] })),
    refetch: vi.fn(),
    ApiClientError,
  };
});

vi.mock("@tanstack/react-query", () => ({ useQuery: mocks.useQuery }));

vi.mock("@/entities/learning-program", () => ({
  learningProgramQueries: {
    detail: mocks.detail,
  },
}));

vi.mock("@/shared/api/client", () => ({ ApiClientError: mocks.ApiClientError }));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

const program = {
  id: "program-1",
  subject: { id: "subject-1", name: "Математика" },
  title: "Алгебра",
  description: "Программа по алгебре",
  status: "ACTIVE" as const,
  version: 1,
  createdAt: "2026-09-18T00:00:00Z",
  updatedAt: "2026-09-18T00:00:00Z",
  hasAssignments: false,
  editable: true,
  modules: [
    {
      id: "module-2",
      title: "Уравнения",
      description: null,
      position: 1,
      topics: [],
    },
    {
      id: "module-1",
      title: "Числа",
      description: "Основы",
      position: 0,
      topics: [
        { id: "topic-1", title: "Натуральные числа", description: "Первый урок", position: 0, status: "ACTIVE" as const, version: 1 },
      ],
    },
  ],
};

describe("TeacherProgramDetailView", () => {
  beforeEach(() => {
    mocks.detail.mockClear();
    mocks.refetch.mockReset();
    mocks.useQuery.mockReturnValue({ data: program, isPending: false, isError: false, refetch: mocks.refetch });
  });

  it("loads and renders the program with ordered modules and topics", () => {
    render(<TeacherProgramDetailView programId="program-1" />);

    expect(mocks.detail).toHaveBeenCalledWith("program-1");
    expect(screen.getByRole("heading", { name: "Алгебра" })).toBeInTheDocument();
    expect(screen.getByText("Математика")).toBeInTheDocument();
    expect(screen.getByText("Активна")).toBeInTheDocument();
    expect(screen.getByText("Натуральные числа")).toBeInTheDocument();
    expect(screen.getByText("В этом модуле пока нет тем.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "← Программы обучения" })).toHaveAttribute("href", "/teacher/programs");

    const modules = screen.getAllByRole("listitem").filter((item) => item.textContent?.includes("Модуль"));
    expect(modules[0]).toHaveTextContent("Числа");
    expect(modules[1]).toHaveTextContent("Уравнения");
  });

  it("renders loading state", () => {
    mocks.useQuery.mockReturnValue({ data: undefined, isPending: true, isError: false, refetch: mocks.refetch });
    render(<TeacherProgramDetailView programId="program-1" />);
    expect(screen.getByText("Загружаем программу…")).toHaveAttribute("aria-busy", "true");
  });

  it("renders empty modules state", () => {
    mocks.useQuery.mockReturnValue({ data: { ...program, modules: [] }, isPending: false, isError: false, refetch: mocks.refetch });
    render(<TeacherProgramDetailView programId="program-1" />);
    expect(screen.getByText("Модулей пока нет")).toBeInTheDocument();
  });

  it("renders a not found state without retry", () => {
    mocks.useQuery.mockReturnValue({ data: undefined, isPending: false, isError: true, error: new mocks.ApiClientError(404), refetch: mocks.refetch });
    render(<TeacherProgramDetailView programId="missing" />);
    expect(screen.getByText("Программа не найдена")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Повторить" })).not.toBeInTheDocument();
  });

  it("allows retry after another loading error", () => {
    mocks.useQuery.mockReturnValue({ data: undefined, isPending: false, isError: true, error: new mocks.ApiClientError(500), refetch: mocks.refetch });
    render(<TeacherProgramDetailView programId="program-1" />);
    fireEvent.click(screen.getByRole("button", { name: "Повторить" }));
    expect(mocks.refetch).toHaveBeenCalled();
  });
});
