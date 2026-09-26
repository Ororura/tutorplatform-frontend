import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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
    bulkStatus: vi.fn(),
    bulkPending: false,
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

vi.mock("@/features/program/topic/bulk-status/api/bulk-topic-status", () => ({
  useBulkTopicStatusMutation: () => ({ mutateAsync: mocks.bulkStatus, isPending: mocks.bulkPending }),
}));

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
    mocks.bulkStatus.mockReset().mockResolvedValue(undefined);
    mocks.bulkPending = false;
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

describe("bulk topic selection", () => {
  const multiModuleProgram = {
    ...program,
    modules: [
      {
        ...program.modules[0],
        topics: [{ ...program.modules[1].topics[0], id: "topic-3", title: "Уравнения", version: 3 }],
      },
      program.modules[1],
    ],
  };
  const showProgram = (data = multiModuleProgram) =>
    mocks.useQuery.mockReturnValue({ data, isPending: false, isError: false, refetch: mocks.refetch });
  const start = () => fireEvent.click(screen.getByRole("button", { name: "Выбрать темы" }));
  const toolbar = () => within(screen.getByRole("region", { name: "Выбор тем" }));
  const choose = (title: string) => fireEvent.click(screen.getByLabelText(`Выбрать тему «${title}»`));

  beforeEach(() => {
    mocks.bulkStatus.mockReset().mockResolvedValue(undefined);
    mocks.bulkPending = false;
    showProgram();
  });

  it("enables selection and shows topic checkboxes only in selection mode", () => {
    render(<TeacherProgramDetailView programId="algebra" />);
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
    start();
    expect(screen.getAllByRole("checkbox")).toHaveLength(3);
    expect(toolbar().getByText("Выбрано: 0")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Выбрать темы" })).not.toBeInTheDocument();
  });

  it("selects individual topics across modules and counts them", () => {
    render(<TeacherProgramDetailView programId="algebra" />);
    start();
    choose("Натуральные числа");
    expect(toolbar().getByText("Выбрано: 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Выбрать тему «Натуральные числа»")).toBeChecked();
    choose("Уравнения");
    expect(toolbar().getByText("Выбрано: 2")).toBeInTheDocument();
    choose("Натуральные числа");
    expect(toolbar().getByText("Выбрано: 1")).toBeInTheDocument();
  });

  it("selects all topics including collapsed modules and clears all on the next action", () => {
    const { container } = render(<TeacherProgramDetailView programId="algebra" />);
    start();
    expect([...container.querySelectorAll("details")].every((item) => !item.open)).toBe(true);
    fireEvent.click(toolbar().getByRole("button", { name: "Выбрать все" }));
    expect(toolbar().getByText("Выбрано: 3")).toBeInTheDocument();
    screen.getAllByRole("checkbox").forEach((checkbox) => expect(checkbox).toBeChecked());
    fireEvent.click(toolbar().getByRole("button", { name: "Снять все" }));
    expect(toolbar().getByText("Выбрано: 0")).toBeInTheDocument();
    screen.getAllByRole("checkbox").forEach((checkbox) => expect(checkbox).not.toBeChecked());
  });

  it.each([
    ["Активировать", "ACTIVE"],
    ["В черновик", "DRAFT"],
  ])("sends %s with current versions and clears selection on success", async (label, status) => {
    const { rerender } = render(<TeacherProgramDetailView programId="algebra" />);
    start();
    choose("Натуральные числа");
    choose("Уравнения");
    showProgram({
      ...multiModuleProgram,
      modules: multiModuleProgram.modules.map((module) => ({
        ...module,
        topics: module.topics.map((topic) => ({ ...topic, version: topic.version + 10 })),
      })),
    });
    rerender(<TeacherProgramDetailView programId="algebra" />);
    fireEvent.click(toolbar().getByRole("button", { name: label }));
    await waitFor(() =>
      expect(mocks.bulkStatus).toHaveBeenCalledWith({
        status,
        topics: [
          { id: "topic-3", version: 13 },
          { id: "topic-1", version: 11 },
        ],
      }),
    );
    await waitFor(() => expect(screen.getByRole("button", { name: "Выбрать темы" })).toBeInTheDocument());
    start();
    expect(toolbar().getByText("Выбрано: 0")).toBeInTheDocument();
  });

  it("keeps select-all across modules but prevents requests above the 375-topic limit", async () => {
    showProgram({
      ...multiModuleProgram,
      modules: multiModuleProgram.modules.map((module, moduleIndex) => ({
        ...module,
        topics: Array.from({ length: 188 }, (_, index) => ({
          ...module.topics[0],
          id: `limit-${moduleIndex}-${index}`,
          title: `Тема ${moduleIndex}-${index}`,
        })),
      })),
    });
    render(<TeacherProgramDetailView programId="algebra" />);
    start();
    fireEvent.click(toolbar().getByRole("button", { name: "Выбрать все" }));
    expect(toolbar().getByText("Выбрано: 376")).toBeInTheDocument();
    expect(toolbar().getByRole("alert")).toHaveTextContent("не более 375 тем");
    for (const name of ["Активировать", "В черновик", "Архивировать"]) {
      const button = toolbar().getByRole("button", { name });
      expect(button).toBeDisabled();
      fireEvent.click(button);
    }
    expect(mocks.bulkStatus).not.toHaveBeenCalled();
    choose("Тема 0-0");
    expect(toolbar().queryByRole("alert")).not.toBeInTheDocument();
    fireEvent.click(toolbar().getByRole("button", { name: "Активировать" }));
    await waitFor(() => expect(mocks.bulkStatus).toHaveBeenCalledTimes(1));
    expect(mocks.bulkStatus.mock.calls[0][0].topics).toHaveLength(375);
  });

  it("confirms archive before sending ARCHIVED", async () => {
    render(<TeacherProgramDetailView programId="algebra" />);
    start();
    choose("Натуральные числа");
    fireEvent.click(toolbar().getByRole("button", { name: "Архивировать" }));
    const confirmation = within(screen.getByRole("dialog", { name: "Архивировать выбранные темы?" }));
    expect(confirmation.getByText("Будут архивированы 1 тем.")).toBeInTheDocument();
    expect(mocks.bulkStatus).not.toHaveBeenCalled();
    fireEvent.click(confirmation.getByRole("button", { name: "Архивировать" }));
    await waitFor(() =>
      expect(mocks.bulkStatus).toHaveBeenCalledWith({ status: "ARCHIVED", topics: [{ id: "topic-1", version: 1 }] }),
    );
  });

  it("cancels archive without submitting or clearing selection", () => {
    render(<TeacherProgramDetailView programId="algebra" />);
    start();
    choose("Натуральные числа");
    fireEvent.click(toolbar().getByRole("button", { name: "Архивировать" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Отмена" }));
    expect(mocks.bulkStatus).not.toHaveBeenCalled();
    expect(toolbar().getByText("Выбрано: 1")).toBeInTheDocument();
  });

  it("preserves selection and presents errors", async () => {
    mocks.bulkStatus.mockRejectedValue(new Error("network"));
    render(<TeacherProgramDetailView programId="algebra" />);
    start();
    choose("Натуральные числа");
    fireEvent.click(toolbar().getByRole("button", { name: "Активировать" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Не удалось изменить статус выбранных тем.");
    expect(toolbar().getByText("Выбрано: 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Выбрать тему «Натуральные числа»")).toBeChecked();
  });

  it("prunes deleted topics from selection when the query changes", () => {
    const { rerender } = render(<TeacherProgramDetailView programId="algebra" />);
    start();
    fireEvent.click(toolbar().getByRole("button", { name: "Выбрать все" }));
    showProgram({ ...multiModuleProgram, modules: [multiModuleProgram.modules[1]] });
    rerender(<TeacherProgramDetailView programId="algebra" />);
    expect(toolbar().getByText("Выбрано: 2")).toBeInTheDocument();
  });

  it("hides all selection controls when the program becomes read-only", () => {
    const { rerender } = render(<TeacherProgramDetailView programId="algebra" />);
    start();
    showProgram({ ...multiModuleProgram, editable: false });
    rerender(<TeacherProgramDetailView programId="algebra" />);
    expect(screen.queryByRole("region", { name: "Выбор тем" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Выбрать темы" })).not.toBeInTheDocument();
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
  });

  it("disables actions without selection and while pending, preventing duplicate submission", async () => {
    let resolve!: () => void;
    mocks.bulkStatus.mockImplementation(
      () =>
        new Promise<void>((done) => {
          resolve = done;
        }),
    );
    const { rerender } = render(<TeacherProgramDetailView programId="algebra" />);
    start();
    expect(toolbar().getByRole("button", { name: "Активировать" })).toBeDisabled();
    choose("Натуральные числа");
    fireEvent.click(toolbar().getByRole("button", { name: "Активировать" }));
    fireEvent.click(toolbar().getByRole("button", { name: "Активировать" }));
    expect(mocks.bulkStatus).toHaveBeenCalledTimes(1);
    mocks.bulkPending = true;
    rerender(<TeacherProgramDetailView programId="algebra" />);
    toolbar()
      .getAllByRole("button")
      .forEach((button) => expect(button).toBeDisabled());
    screen.getAllByRole("checkbox").forEach((checkbox) => expect(checkbox).toBeDisabled());
    expect(screen.getByRole("status")).toHaveTextContent("Сохраняем…");
    await act(async () => resolve());
  });
});
