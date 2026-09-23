import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DeleteMaterialDialog } from "./delete-material-dialog";
import type { LessonMaterial } from "@/entities/material";

const mocks = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
  useDeleteMaterialMutation: vi.fn(),
}));

vi.mock("../api/delete-material", () => ({
  useDeleteMaterialMutation: mocks.useDeleteMaterialMutation,
}));

vi.mock("@/shared/api/client", () => ({
  ApiClientError: class ApiClientError extends Error {
    constructor(public status: number) {
      super("API error");
    }
  },
}));

const material = {
  id: "material-id",
  topicId: "topic-id",
  title: "Проверочный PDF",
  materialType: "FILE" as const,
  position: 0,
  version: 0,
  createdAt: "2026-09-23T10:00:00Z",
  updatedAt: "2026-09-23T10:00:00Z",
} satisfies LessonMaterial;

beforeEach(() => {
  mocks.mutateAsync.mockReset();
  mocks.useDeleteMaterialMutation.mockReset();
  mocks.useDeleteMaterialMutation.mockReturnValue({
    isPending: false,
    mutateAsync: mocks.mutateAsync,
  });
  // jsdom does not implement the native HTMLDialogElement modal methods.
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
});

describe("DeleteMaterialDialog", () => {
  it("requires explicit confirmation and can be cancelled", () => {
    render(<DeleteMaterialDialog material={material} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Удалить «Проверочный PDF»" }));
    expect(screen.getByRole("dialog", { name: "Удалить материал" })).toBeInTheDocument();
    expect(screen.getByText(/Это действие нельзя отменить/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Отмена" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mocks.mutateAsync).not.toHaveBeenCalled();
  });

  it("deletes selected material only after confirmation", async () => {
    mocks.mutateAsync.mockResolvedValue(undefined);
    render(<DeleteMaterialDialog material={material} />);
    expect(mocks.useDeleteMaterialMutation).toHaveBeenCalledWith("topic-id");
    fireEvent.click(screen.getByRole("button", { name: "Удалить «Проверочный PDF»" }));
    fireEvent.click(screen.getByRole("button", { name: "Удалить материал" }));
    await waitFor(() => expect(mocks.mutateAsync).toHaveBeenCalledWith("material-id"));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("keeps dialog open and displays an error after failure", async () => {
    mocks.mutateAsync.mockRejectedValue(new Error("S3 unavailable"));
    render(<DeleteMaterialDialog material={material} />);
    fireEvent.click(screen.getByRole("button", { name: "Удалить «Проверочный PDF»" }));
    fireEvent.click(screen.getByRole("button", { name: "Удалить материал" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Не удалось удалить материал");
    expect(screen.getByRole("dialog", { name: "Удалить материал" })).toBeInTheDocument();
  });
});
