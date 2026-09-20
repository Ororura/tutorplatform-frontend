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
  SafeMarkdown: ({ children }: { children: string }) => <div data-testid="markdown-preview">{children}</div>,
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
    expect(screen.getByTestId("markdown-preview")).toHaveTextContent("# Заголовок");
    expect(screen.getByTestId("markdown-preview")).toHaveTextContent("Текст");
    fireEvent.click(screen.getByRole("tab", { name: "Редактор" }));
    expect(screen.getByRole("textbox", { name: "Содержимое Markdown" })).toHaveValue(content);
  });
});
