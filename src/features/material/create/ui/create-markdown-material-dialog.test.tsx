import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CreateMarkdownMaterialDialog } from "./create-markdown-material-dialog";

const mocks = vi.hoisted(() => ({ mutateAsync: vi.fn() }));

vi.mock("../api/create-material", () => ({
  useCreateMaterialMutation: () => ({ mutateAsync: mocks.mutateAsync, isPending: false }),
}));
vi.mock("@/shared/ui/button", () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}));
vi.mock("@/entities/material", () => ({
  MaterialRenderer: ({ material }: { material: { materialType: string; content?: string | null } }) => (
    <div data-testid="material-preview">
      {material.materialType}: {material.content}
    </div>
  ),
}));

describe("CreateMarkdownMaterialDialog", () => {
  beforeEach(() => {
    mocks.mutateAsync.mockReset().mockResolvedValue(undefined);
  });

  it("keeps Markdown content when switching between editor and preview", () => {
    render(<CreateMarkdownMaterialDialog topicId="topic-1" position={0} editable />);
    fireEvent.click(screen.getByRole("button", { name: "Добавить материал" }));

    const content = "# Заголовок\nТекст";
    fireEvent.change(screen.getByRole("textbox", { name: "Содержимое Markdown" }), { target: { value: content } });
    fireEvent.click(screen.getByRole("tab", { name: "Предпросмотр" }));
    expect(screen.getByTestId("material-preview")).toHaveTextContent("MARKDOWN: # Заголовок");
    expect(screen.getByTestId("material-preview")).toHaveTextContent("Текст");
    fireEvent.click(screen.getByRole("tab", { name: "Редактор" }));
    expect(screen.getByRole("textbox", { name: "Содержимое Markdown" })).toHaveValue(content);
  });

  it("creates a CODE_EXAMPLE with a monospace editor and MaterialRenderer preview", async () => {
    render(<CreateMarkdownMaterialDialog topicId="topic-1" position={2} editable />);
    fireEvent.click(screen.getByRole("button", { name: "Добавить материал" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Название" }), { target: { value: "Python" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Тип материала" }), {
      target: { value: "CODE_EXAMPLE" },
    });
    const code = "print('hello')";
    fireEvent.change(screen.getByRole("textbox", { name: "Содержимое кода" }), { target: { value: code } });
    expect(screen.getByRole("textbox", { name: "Содержимое кода" })).toHaveClass("font-mono");
    fireEvent.click(screen.getByRole("tab", { name: "Предпросмотр" }));
    expect(screen.getByTestId("material-preview")).toHaveTextContent(`CODE_EXAMPLE: ${code}`);
    fireEvent.click(screen.getByRole("tab", { name: "Редактор" }));
    fireEvent.click(screen.getByRole("button", { name: "Добавить" }));
    expect(mocks.mutateAsync).toHaveBeenCalledWith({
      materialType: "CODE_EXAMPLE",
      title: "Python",
      content: code,
      externalUrl: null,
      position: 2,
    });
    await Promise.resolve();
  });

  it("previews and creates only http/https links", () => {
    render(<CreateMarkdownMaterialDialog topicId="topic-1" position={1} editable />);
    fireEvent.click(screen.getByRole("button", { name: "Добавить материал" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Название" }), { target: { value: "Документация" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Тип материала" }), { target: { value: "LINK" } });
    const url = "https://example.com/docs";
    fireEvent.change(screen.getByRole("textbox", { name: "Ссылка" }), { target: { value: url } });
    expect(screen.getByRole("link", { name: url })).toHaveAttribute("href", url);
    fireEvent.click(screen.getByRole("button", { name: "Добавить" }));
    expect(mocks.mutateAsync).toHaveBeenCalledWith({
      materialType: "LINK",
      title: "Документация",
      content: null,
      externalUrl: url,
      position: 1,
    });
  });

  it("rejects non-http links before calling the API", () => {
    render(<CreateMarkdownMaterialDialog topicId="topic-1" position={0} editable />);
    fireEvent.click(screen.getByRole("button", { name: "Добавить материал" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Название" }), { target: { value: "Ссылка" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Тип материала" }), { target: { value: "LINK" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Ссылка" }), { target: { value: "javascript:alert(1)" } });
    fireEvent.click(screen.getByRole("button", { name: "Добавить" }));
    expect(screen.getByRole("alert")).toHaveTextContent("http:// или https://");
    expect(mocks.mutateAsync).not.toHaveBeenCalled();
  });
});
