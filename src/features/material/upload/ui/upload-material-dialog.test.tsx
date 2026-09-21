import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { UploadMaterialDialog } from "./upload-material-dialog";

const mocks = vi.hoisted(() => ({ mutateAsync: vi.fn(), createObjectURL: vi.fn(), revokeObjectURL: vi.fn() }));

vi.mock("../api/upload-material", () => ({
  useUploadMaterialMutation: () => ({ mutateAsync: mocks.mutateAsync, isPending: false }),
}));
vi.mock("@/shared/ui/button", () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}));

describe("UploadMaterialDialog", () => {
  beforeEach(() => {
    mocks.mutateAsync.mockReset().mockResolvedValue(undefined);
    mocks.createObjectURL.mockReset().mockReturnValue("blob:preview");
    mocks.revokeObjectURL.mockReset();
    vi.stubGlobal("URL", { createObjectURL: mocks.createObjectURL, revokeObjectURL: mocks.revokeObjectURL });
  });

  it("shows selected image metadata and preview, then uploads multipart material data", async () => {
    render(<UploadMaterialDialog topicId="topic-1" position={3} editable />);
    fireEvent.click(screen.getByRole("button", { name: "Загрузить файл" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Название" }), { target: { value: "Схема" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Тип файла" }), { target: { value: "IMAGE" } });
    const file = new File(["image"], "scheme.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("Выберите файл"), { target: { files: [file] } });

    expect(screen.getByText("scheme.png · 5 Б")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Предпросмотр выбранного изображения" })).toHaveAttribute(
      "src",
      "blob:preview",
    );

    fireEvent.click(screen.getByRole("button", { name: "Загрузить" }));
    expect(mocks.mutateAsync).toHaveBeenCalledWith({ materialType: "IMAGE", title: "Схема", position: 3, file });
  });

  it("rejects files above the backend default limit and incompatible image MIME types", () => {
    render(<UploadMaterialDialog topicId="topic-1" position={0} editable />);
    fireEvent.click(screen.getByRole("button", { name: "Загрузить файл" }));
    const oversized = new File([new Uint8Array(10 * 1024 * 1024 + 1)], "large.pdf", { type: "application/pdf" });
    fireEvent.change(screen.getByLabelText("Выберите файл"), { target: { files: [oversized] } });
    expect(screen.getByRole("alert")).toHaveTextContent("10 МиБ");

    const text = new File(["notes"], "notes.txt", { type: "text/plain" });
    fireEvent.change(screen.getByLabelText("Выберите файл"), { target: { files: [text] } });
    fireEvent.change(screen.getByRole("combobox", { name: "Тип файла" }), { target: { value: "IMAGE" } });
    expect(screen.getByRole("alert")).toHaveTextContent("PNG и JPEG");
    expect(mocks.mutateAsync).not.toHaveBeenCalled();
  });

  it("accepts a shell script as FILE but rejects it as IMAGE", async () => {
    render(<UploadMaterialDialog topicId="topic-1" position={1} editable />);
    fireEvent.click(screen.getByRole("button", { name: "Загрузить файл" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Название" }), { target: { value: "Скрипт" } });
    const input = screen.getByLabelText("Выберите файл");
    expect(input).toHaveAttribute("accept", expect.stringContaining(".sh"));

    const script = new File(["#!/bin/sh\necho lesson"], "lesson.sh", { type: "application/octet-stream" });
    fireEvent.change(input, { target: { files: [script] } });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole("combobox", { name: "Тип файла" }), { target: { value: "IMAGE" } });
    expect(screen.getByRole("alert")).toHaveTextContent("PNG и JPEG");
    expect(input).toHaveAttribute("accept", ".png,.jpg,.jpeg");
    fireEvent.change(screen.getByRole("combobox", { name: "Тип файла" }), { target: { value: "FILE" } });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Загрузить" }));
    expect(mocks.mutateAsync).toHaveBeenCalledWith({
      materialType: "FILE",
      title: "Скрипт",
      position: 1,
      file: script,
    });
  });
});
