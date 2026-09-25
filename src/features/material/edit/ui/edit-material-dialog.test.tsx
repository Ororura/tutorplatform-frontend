import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LessonMaterial } from "@/entities/material";

import { EditMaterialDialog, type EditableMaterial } from "./edit-material-dialog";

const mocks = vi.hoisted(() => {
  class ApiClientError extends Error {
    constructor(public status: number) {
      super("API error");
    }
  }

  return {
    mutateAsync: vi.fn(),
    invalidateQueries: vi.fn(),
    ApiClientError,
  };
});

vi.mock("../api/update-material", () => ({
  useUpdateMaterialMutation: () => ({ mutateAsync: mocks.mutateAsync, isPending: false }),
}));
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: mocks.invalidateQueries }),
}));
vi.mock("@/shared/api/client", () => ({ ApiClientError: mocks.ApiClientError }));
vi.mock("@/shared/ui/button", () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}));
vi.mock("@/entities/material", () => ({
  SafeMarkdown: ({ children }: { children: string }) => <div data-testid="markdown-preview">{children}</div>,
  topicMaterialQueries: { list: (topicId: string) => ({ queryKey: ["topic-materials", topicId] }) },
}));

function material(
  materialType: EditableMaterial["materialType"],
  overrides: Partial<LessonMaterial> = {},
): EditableMaterial {
  return {
    id: "material-1",
    topicId: "topic-1",
    materialType,
    title: "Исходное название",
    content: "Исходное содержимое",
    position: 7,
    version: 12,
    createdAt: "2026-09-01T00:00:00Z",
    updatedAt: "2026-09-01T00:00:00Z",
    ...overrides,
  } as EditableMaterial;
}

describe("EditMaterialDialog", () => {
  beforeEach(() => {
    mocks.mutateAsync.mockReset().mockResolvedValue(undefined);
    mocks.invalidateQueries.mockReset().mockResolvedValue(undefined);
  });

  it("saves TEXT with its current type, version and position", async () => {
    render(<EditMaterialDialog material={material("TEXT")} />);

    fireEvent.click(screen.getByRole("button", { name: "Редактировать" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Название" }), { target: { value: " Новое название " } });
    fireEvent.change(screen.getByRole("textbox", { name: "Содержимое" }), {
      target: { value: "Новое содержимое" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));

    await waitFor(() =>
      expect(mocks.mutateAsync).toHaveBeenCalledWith({
        materialType: "TEXT",
        title: "Новое название",
        content: "Новое содержимое",
        externalUrl: null,
        position: 7,
        version: 12,
      }),
    );
  });

  it("allows an existing TEXT material to be corrected to MARKDOWN without changing its content", async () => {
    const content = "Нужна версия **3.11 или новее**.";
    render(<EditMaterialDialog material={material("TEXT", { content })} />);

    fireEvent.click(screen.getByRole("button", { name: "Редактировать" }));
    fireEvent.change(screen.getByRole("combobox", { name: "Тип материала" }), {
      target: { value: "MARKDOWN" },
    });
    expect(screen.getByRole("textbox", { name: "Содержимое Markdown" })).toHaveValue(content);
    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));

    await waitFor(() =>
      expect(mocks.mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ materialType: "MARKDOWN", content, version: 12 }),
      ),
    );
  });

  it("saves LINK in externalUrl and shows the current type", async () => {
    render(
      <EditMaterialDialog material={material("LINK", { content: null, externalUrl: "https://example.com/old" })} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Редактировать" }));
    expect(screen.getByDisplayValue("Ссылка")).toHaveAttribute("readonly");
    fireEvent.change(screen.getByRole("textbox", { name: "URL" }), {
      target: { value: " https://example.com/new " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));

    await waitFor(() =>
      expect(mocks.mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ content: null, externalUrl: "https://example.com/new" }),
      ),
    );
  });

  it("reuses the Markdown preview without losing edited content", () => {
    render(<EditMaterialDialog material={material("MARKDOWN")} />);

    fireEvent.click(screen.getByRole("button", { name: "Редактировать" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Содержимое Markdown" }), {
      target: { value: "# Новый текст" },
    });
    fireEvent.click(screen.getByRole("tab", { name: "Предпросмотр" }));
    expect(screen.getByTestId("markdown-preview")).toHaveTextContent("# Новый текст");
    fireEvent.click(screen.getByRole("tab", { name: "Редактор" }));
    expect(screen.getByRole("textbox", { name: "Содержимое Markdown" })).toHaveValue("# Новый текст");
  });

  it("offers to refresh stale material after a version conflict", async () => {
    mocks.mutateAsync.mockRejectedValueOnce(new mocks.ApiClientError(409));
    render(<EditMaterialDialog material={material("CODE_EXAMPLE")} />);

    fireEvent.click(screen.getByRole("button", { name: "Редактировать" }));
    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Данные материала устарели");
    fireEvent.click(screen.getByRole("button", { name: "Обновить материал" }));
    await waitFor(() =>
      expect(mocks.invalidateQueries).toHaveBeenCalledWith({ queryKey: ["topic-materials", "topic-1"] }),
    );
  });
});
