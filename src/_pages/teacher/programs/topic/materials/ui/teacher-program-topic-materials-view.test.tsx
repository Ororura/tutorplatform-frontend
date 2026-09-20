import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TeacherProgramTopicMaterialsView } from "./teacher-program-topic-materials-view";

const mocks = vi.hoisted(() => {
  class ApiClientError extends Error {
    constructor(public status: number) {
      super("API error");
    }
  }

  return {
    useQuery: vi.fn(),
    programDetail: vi.fn((programId: string) => ({ queryKey: ["program", programId] })),
    materialsList: vi.fn((topicId: string) => ({ queryKey: ["materials", topicId] })),
    programRefetch: vi.fn(),
    materialsRefetch: vi.fn(),
    ApiClientError,
  };
});

vi.mock("@tanstack/react-query", () => ({ useQuery: mocks.useQuery }));
vi.mock("@/entities/learning-program", () => ({ learningProgramQueries: { detail: mocks.programDetail } }));
vi.mock("@/entities/material", () => ({
  topicMaterialQueries: { list: mocks.materialsList },
  MaterialList: ({
    materials,
    renderActions,
  }: {
    materials: Array<{ id: string; title: string; materialType?: string }>;
    renderActions?: (material: { id: string; title: string; materialType?: string }) => React.ReactNode;
  }) => (
    <ol data-testid="materials-list">
      {materials.map((material) => (
        <li key={material.title}>
          {material.title}
          {renderActions?.(material)}
        </li>
      ))}
    </ol>
  ),
}));
vi.mock("@/features/material/edit", () => ({
  isEditableMaterial: (material: { materialType?: string }) =>
    ["TEXT", "MARKDOWN", "CODE_EXAMPLE", "LINK"].includes(material.materialType ?? ""),
  EditMaterialDialog: ({ material }: { material: { id: string } }) => (
    <button type="button">Редактировать {material.id}</button>
  ),
}));
vi.mock("@/features/material/create", () => ({
  CreateMarkdownMaterialDialog: () => <button type="button">Добавить материал</button>,
}));
vi.mock("@/features/material/upload", () => ({
  UploadMaterialDialog: () => <button type="button">Загрузить файл</button>,
}));
vi.mock("@/shared/api/client", () => ({ ApiClientError: mocks.ApiClientError }));
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const program = {
  id: "program-1",
  title: "Алгебра",
  modules: [
    {
      id: "module-1",
      title: "Уравнения",
      topics: [{ id: "topic-1", title: "Линейные уравнения", description: "Научимся решать уравнения." }],
    },
  ],
};

function queryResult(overrides: Record<string, unknown> = {}) {
  return { data: undefined, isPending: false, isError: false, refetch: vi.fn(), ...overrides };
}

describe("TeacherProgramTopicMaterialsView", () => {
  beforeEach(() => {
    mocks.programDetail.mockClear();
    mocks.materialsList.mockClear();
    mocks.programRefetch.mockReset();
    mocks.materialsRefetch.mockReset();
    mocks.useQuery
      .mockReturnValueOnce(queryResult({ data: program, refetch: mocks.programRefetch }))
      .mockReturnValueOnce(
        queryResult({
          data: [
            { id: "material-2", title: "Второй", position: 2 },
            { id: "material-1", title: "Первый", position: 1 },
          ],
          refetch: mocks.materialsRefetch,
        }),
      );
  });

  it("validates topic membership, renders breadcrumbs, topic details and materials ordered by position", () => {
    render(<TeacherProgramTopicMaterialsView programId="program-1" topicId="topic-1" />);

    expect(mocks.programDetail).toHaveBeenCalledWith("program-1");
    expect(mocks.materialsList).toHaveBeenCalledWith("topic-1");
    expect(screen.getByRole("navigation", { name: "Хлебные крошки" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Алгебра" })).toHaveAttribute("href", "/teacher/programs/program-1");
    expect(screen.getByRole("heading", { name: "Линейные уравнения" })).toBeInTheDocument();
    expect(screen.getByText("Научимся решать уравнения.")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual(["Первый", "Второй"]);
  });

  it("renders a loading state", () => {
    mocks.useQuery.mockReset();
    mocks.useQuery.mockReturnValueOnce(queryResult({ isPending: true })).mockReturnValueOnce(queryResult());
    render(<TeacherProgramTopicMaterialsView programId="program-1" topicId="topic-1" />);
    expect(screen.getByText("Загружаем тему…")).toHaveAttribute("aria-busy", "true");
  });

  it("renders a 404 state when the topic does not belong to the program", () => {
    mocks.useQuery.mockReset();
    mocks.useQuery
      .mockReturnValueOnce(queryResult({ data: { ...program, modules: [] } }))
      .mockReturnValueOnce(queryResult());
    render(<TeacherProgramTopicMaterialsView programId="program-1" topicId="other-topic" />);
    expect(screen.getByText("Тема не найдена")).toBeInTheDocument();
    expect(mocks.useQuery.mock.calls[1][0]).toMatchObject({ enabled: false });
  });

  it("renders material loading, error and empty states", () => {
    mocks.useQuery.mockReset();
    mocks.useQuery
      .mockReturnValueOnce(queryResult({ data: program }))
      .mockReturnValueOnce(queryResult({ isPending: true }));
    const { rerender } = render(<TeacherProgramTopicMaterialsView programId="program-1" topicId="topic-1" />);
    expect(screen.getByText("Загружаем материалы…")).toHaveAttribute("aria-busy", "true");

    mocks.useQuery.mockReset();
    mocks.useQuery
      .mockReturnValueOnce(queryResult({ data: program }))
      .mockReturnValueOnce(
        queryResult({ isError: true, error: new mocks.ApiClientError(500), refetch: mocks.materialsRefetch }),
      );
    rerender(<TeacherProgramTopicMaterialsView programId="program-1" topicId="topic-1" />);
    fireEvent.click(screen.getByRole("button", { name: "Повторить" }));
    expect(mocks.materialsRefetch).toHaveBeenCalled();

    mocks.useQuery.mockReset();
    mocks.useQuery.mockReturnValueOnce(queryResult({ data: program })).mockReturnValueOnce(queryResult({ data: [] }));
    rerender(<TeacherProgramTopicMaterialsView programId="program-1" topicId="topic-1" />);
    expect(screen.getByTestId("materials-list")).toBeEmptyDOMElement();
  });

  it("offers editing only for supported material types in an editable program", () => {
    mocks.useQuery.mockReset();
    mocks.useQuery.mockReturnValueOnce(queryResult({ data: { ...program, editable: true } })).mockReturnValueOnce(
      queryResult({
        data: [
          { id: "text", title: "Текст", materialType: "TEXT", position: 1 },
          { id: "file", title: "Файл", materialType: "FILE", position: 2 },
          { id: "image", title: "Изображение", materialType: "IMAGE", position: 3 },
        ],
      }),
    );

    render(<TeacherProgramTopicMaterialsView programId="program-1" topicId="topic-1" />);

    expect(screen.getByRole("button", { name: "Редактировать text" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Редактировать file" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Редактировать image" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Загрузить файл" })).toBeInTheDocument();
  });
});
