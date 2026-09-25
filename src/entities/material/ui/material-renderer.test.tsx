import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { LessonMaterial } from "../api/material-queries";
import { MaterialList } from "./material-list";
import { MaterialRenderer } from "./material-renderer";

function material(
  materialType: LessonMaterial["materialType"],
  overrides: Partial<LessonMaterial> = {},
): LessonMaterial {
  return {
    id: `material-${materialType}`,
    topicId: "topic-1",
    materialType,
    title: `${materialType} title`,
    position: 1,
    version: 1,
    createdAt: "2026-09-01T00:00:00Z",
    updatedAt: "2026-09-01T00:00:00Z",
    ...overrides,
  };
}

describe("MaterialRenderer", () => {
  it("renders TEXT preserving line breaks without HTML interpretation", () => {
    const { container } = render(
      <MaterialRenderer material={material("TEXT", { content: "Строка 1\n<b>Строка 2</b>" })} />,
    );
    expect(screen.getByText(/Строка 1/)).toHaveClass("whitespace-pre-wrap");
    expect(container.querySelector("b")).toBeNull();
  });

  it("renders safe MARKDOWN without raw HTML", () => {
    const { container } = render(
      <MaterialRenderer
        material={material("MARKDOWN", { content: "## Заголовок\nТекст <script>alert(1)</script>" })}
      />,
    );
    expect(screen.getByRole("heading", { name: "Заголовок" })).toBeInTheDocument();
    expect(screen.getByText(/<script>/)).toBeInTheDocument();
    expect(container.querySelector("script")).toBeNull();
  });

  it("renders CODE_EXAMPLE as read-only code", () => {
    const { container } = render(
      <MaterialRenderer material={material("CODE_EXAMPLE", { content: "for i in range(3):\n    print(i)" })} />,
    );
    expect(container.querySelector("pre code")).toHaveTextContent("for i in range(3):");
  });

  it("renders a safe external LINK", () => {
    render(<MaterialRenderer material={material("LINK", { externalUrl: "https://example.com/lesson" })} />);
    expect(screen.getByRole("link", { name: "Открыть материал" })).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders draft links safely and never offers downloads for draft files", () => {
    const { rerender } = render(
      <MaterialRenderer
        preview
        material={{ materialType: "LINK", title: "Draft link", externalUrl: "javascript:alert(1)" }}
      />,
    );
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    rerender(<MaterialRenderer preview material={{ materialType: "FILE", title: "Draft file" }} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("Файл пока недоступен для скачивания.")).toBeInTheDocument();
  });

  it.each([
    ["FILE" as const, "Скачать файл"],
    ["IMAGE" as const, "Открыть изображение"],
  ])("uses the official download endpoint for %s", (type, label) => {
    render(<MaterialRenderer material={material(type)} />);
    expect(screen.getByRole("link", { name: label })).toHaveAttribute(
      "href",
      `/api/v1/teacher/topics/topic-1/materials/material-${type}/download`,
    );
  });

  it("falls back safely for an unknown material type", () => {
    const unknown = { ...material("TEXT"), materialType: "VIDEO" } as unknown as LessonMaterial;
    render(<MaterialRenderer material={unknown} />);
    expect(screen.getByText("Этот тип материала пока не поддерживается.")).toBeInTheDocument();
  });

  it("renders an empty materials state", () => {
    render(<MaterialList materials={[]} />);
    expect(screen.getByText("Для этой темы пока нет материалов.")).toBeInTheDocument();
  });

  it("keeps materials in server-defined order", () => {
    const { container } = render(
      <MaterialList
        materials={[
          material("TEXT", { id: "second", title: "Второй по API", position: 20 }),
          material("TEXT", { id: "first", title: "Первый по API", position: 10 }),
        ]}
      />,
    );
    const text = container.textContent ?? "";
    expect(text.indexOf("Второй по API")).toBeLessThan(text.indexOf("Первый по API"));
  });
});
