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
    bySlug: vi.fn((slug: string) => ({ queryKey: ["learning-programs", "slug", slug] })),
    refetch: vi.fn(),
    reorderModules: vi.fn(),
    reorderTopics: vi.fn(),
    reorderPending: false,
    previewPackage: vi.fn(),
    importPackage: vi.fn(),
    previewHook: vi.fn(),
    importHook: vi.fn(),
    ApiClientError,
  };
});

vi.mock("@tanstack/react-query", () => ({ useQuery: mocks.useQuery }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: vi.fn(),
  }),
}));

vi.mock("@/entities/learning-program", () => ({
  learningProgramQueries: {
    detail: mocks.detail,
    bySlug: mocks.bySlug,
  },
}));

vi.mock("@/shared/api/client", () => ({ ApiClientError: mocks.ApiClientError }));

vi.mock("@/features/program/activate", () => ({
  ActivateLearningProgramButton: () => <button type="button">Активировать</button>,
}));

vi.mock("@/features/program/archive", () => ({
  ArchiveLearningProgramButton: () => <button type="button">Архивировать</button>,
}));

vi.mock("@/features/program/edit", () => ({
  EditLearningProgramDialog: () => <button type="button">Редактировать</button>,
}));

vi.mock("@/features/program/import/api/preview-content-package", () => ({
  usePreviewContentPackageMutation: mocks.previewHook,
}));

vi.mock("@/features/program/import/api/import-content-package", () => ({
  useImportContentPackageMutation: mocks.importHook,
}));

vi.mock("@/features/program/module/manage", () => ({
  CreateLearningProgramModuleDialog: ({ editable }: { editable: boolean }) =>
    editable ? <button type="button">Добавить модуль</button> : null,
  LearningProgramModuleActions: ({ editable }: { editable: boolean }) =>
    editable ? <button type="button">Изменить</button> : null,
  useReorderLearningProgramModulesMutation: () => ({ mutate: mocks.reorderModules, isPending: mocks.reorderPending }),
}));

vi.mock("@/features/program/topic/manage", () => ({
  CreateLearningProgramTopicDialog: ({ editable }: { editable: boolean }) =>
    editable ? <button type="button">Добавить тему</button> : null,
  LearningProgramTopicActions: ({ editable }: { editable: boolean }) =>
    editable ? <button type="button">Изменить тему</button> : null,
  useReorderLearningProgramTopicsMutation: () => ({ mutate: mocks.reorderTopics, isPending: mocks.reorderPending }),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const program = {
  id: "program-1",
  slug: "algebra",
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
        {
          id: "topic-1",
          slug: "naturalnye-chisla",
          title: "Натуральные числа",
          description: "Первый урок",
          position: 0,
          status: "ACTIVE" as const,
          version: 1,
        },
        {
          id: "topic-2",
          slug: "tselye-chisla",
          title: "Целые числа",
          description: null,
          position: 1,
          status: "DRAFT" as const,
          version: 1,
        },
      ],
    },
  ],
};

describe("TeacherProgramDetailView", () => {
  beforeEach(() => {
    mocks.detail.mockClear();
    mocks.bySlug.mockClear();
    mocks.refetch.mockReset();
    mocks.reorderModules.mockReset();
    mocks.reorderTopics.mockReset();
    mocks.reorderPending = false;
    mocks.previewPackage.mockReset();
    mocks.importPackage.mockReset();
    mocks.previewHook.mockReset().mockReturnValue({ mutateAsync: mocks.previewPackage });
    mocks.importHook.mockReset().mockReturnValue({ mutateAsync: mocks.importPackage });
    mocks.useQuery.mockReturnValue({ data: program, isPending: false, isError: false, refetch: mocks.refetch });
  });

  it("loads and renders the program with ordered modules and topics", () => {
    render(<TeacherProgramDetailView programId="algebra" />);

    expect(mocks.bySlug).toHaveBeenCalledWith("algebra");
    expect(screen.getByRole("heading", { name: "Алгебра" })).toBeInTheDocument();
    expect(screen.getByText("Математика")).toBeInTheDocument();
    expect(screen.getAllByText("Активна")).toHaveLength(2);
    expect(screen.getByText("Натуральные числа")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Натуральные числа" })).toHaveAttribute(
      "href",
      "/teacher/programs/algebra/topics/naturalnye-chisla",
    );
    expect(screen.getAllByRole("button", { name: "Добавить тему" })).toHaveLength(2);
    expect(screen.getByText("В этом модуле пока нет тем.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "← Программы обучения" })).toHaveAttribute("href", "/teacher/programs");

    const modules = screen.getAllByRole("listitem").filter((item) => item.textContent?.includes("Модуль"));
    expect(modules[0]).toHaveTextContent("Числа");
    expect(modules[1]).toHaveTextContent("Уравнения");
  });

  it("reorders modules and topics with complete ordered IDs", () => {
    render(<TeacherProgramDetailView programId="algebra" />);

    const moduleUp = screen.getAllByRole("button", { name: "Переместить модуль вверх" });
    const moduleDown = screen.getAllByRole("button", { name: "Переместить модуль вниз" });
    expect(moduleUp[0]).toBeDisabled();
    expect(moduleDown[1]).toBeDisabled();
    fireEvent.click(moduleDown[0]);
    expect(mocks.reorderModules).toHaveBeenCalledWith({ orderedIds: ["module-2", "module-1"] });

    const topicUp = screen.getAllByRole("button", { name: "Переместить тему вверх" });
    const topicDown = screen.getAllByRole("button", { name: "Переместить тему вниз" });
    expect(topicUp[0]).toBeDisabled();
    expect(topicDown[1]).toBeDisabled();
    fireEvent.click(topicDown[0]);
    expect(mocks.reorderTopics).toHaveBeenCalledWith({ orderedIds: ["topic-2", "topic-1"] });
  });

  it("blocks all order controls while a reorder request is pending", () => {
    mocks.reorderPending = true;
    render(<TeacherProgramDetailView programId="algebra" />);

    screen
      .getAllByRole("button", { name: "Переместить модуль вверх" })
      .forEach((button) => expect(button).toBeDisabled());
    screen
      .getAllByRole("button", { name: "Переместить модуль вниз" })
      .forEach((button) => expect(button).toBeDisabled());
    screen
      .getAllByRole("button", { name: "Переместить тему вверх" })
      .forEach((button) => expect(button).toBeDisabled());
    screen.getAllByRole("button", { name: "Переместить тему вниз" }).forEach((button) => expect(button).toBeDisabled());
  });

  it("renders loading state", () => {
    mocks.useQuery.mockReturnValue({ data: undefined, isPending: true, isError: false, refetch: mocks.refetch });
    render(<TeacherProgramDetailView programId="algebra" />);
    expect(screen.getByText("Загружаем программу…")).toHaveAttribute("aria-busy", "true");
  });

  it("renders empty modules state", () => {
    mocks.useQuery.mockReturnValue({
      data: { ...program, modules: [] },
      isPending: false,
      isError: false,
      refetch: mocks.refetch,
    });
    render(<TeacherProgramDetailView programId="algebra" />);
    expect(screen.getByText("Модулей пока нет")).toBeInTheDocument();
  });

  it("shows editable actions and makes archived programs read-only", () => {
    mocks.useQuery.mockReturnValue({
      data: { ...program, status: "DRAFT" as const },
      isPending: false,
      isError: false,
      refetch: mocks.refetch,
    });
    const { rerender } = render(<TeacherProgramDetailView programId="algebra" />);

    expect(screen.getByRole("button", { name: "Редактировать" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Добавить модуль" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Импортировать модули" })).toBeInTheDocument();
    expect(mocks.previewHook).toHaveBeenCalledWith(program.id);
    expect(mocks.importHook).toHaveBeenCalledWith(program.id);
    fireEvent.click(screen.getByRole("button", { name: "Импортировать модули" }));
    expect(screen.getByRole("dialog", { name: "Импорт учебных модулей" })).toBeInTheDocument();
    expect(screen.getByLabelText("Выберите YAML-файл")).toHaveAttribute("accept", ".yaml,.yml");
    expect(screen.getAllByRole("button", { name: "Добавить тему" })).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Активировать" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Архивировать" })).toBeInTheDocument();

    mocks.useQuery.mockReturnValue({
      data: { ...program, status: "ARCHIVED" as const, editable: false },
      isPending: false,
      isError: false,
      refetch: mocks.refetch,
    });
    rerender(<TeacherProgramDetailView programId="algebra" />);

    expect(screen.queryByRole("button", { name: "Редактировать" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Добавить модуль" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Импортировать модули" })).not.toBeInTheDocument();
    expect(screen.queryAllByRole("button", { name: "Добавить тему" })).toHaveLength(0);
    expect(screen.queryByRole("button", { name: "Активировать" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Архивировать" })).not.toBeInTheDocument();
  });

  it("hides import for an assigned program even if editable is stale", () => {
    mocks.useQuery.mockReturnValue({
      data: { ...program, hasAssignments: true },
      isPending: false,
      isError: false,
      refetch: mocks.refetch,
    });
    render(<TeacherProgramDetailView programId="algebra" />);
    expect(screen.queryByRole("button", { name: "Импортировать модули" })).not.toBeInTheDocument();
  });

  it("renders a not found state without retry", () => {
    mocks.useQuery.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      error: new mocks.ApiClientError(404),
      refetch: mocks.refetch,
    });
    render(<TeacherProgramDetailView programId="missing" />);
    expect(screen.getByText("Программа не найдена")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Повторить" })).not.toBeInTheDocument();
  });

  it("allows retry after another loading error", () => {
    mocks.useQuery.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      error: new mocks.ApiClientError(500),
      refetch: mocks.refetch,
    });
    render(<TeacherProgramDetailView programId="algebra" />);
    fireEvent.click(screen.getByRole("button", { name: "Повторить" }));
    expect(mocks.refetch).toHaveBeenCalled();
  });
});
