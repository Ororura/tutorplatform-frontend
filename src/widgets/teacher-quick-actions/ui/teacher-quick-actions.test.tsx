import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TeacherQuickActions } from "./teacher-quick-actions";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@tanstack/react-query", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-query")>()),
  useQuery: () => ({ data: [], isPending: false, isError: false }),
}));
vi.mock("@/features/student/create/api/create-student", () => ({
  useCreateStudentMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock("@/features/program/create/api/create-learning-program", () => ({
  useCreateLearningProgramMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock("@/features/task/create/api/create-task", () => ({
  useCreateTaskMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

describe("TeacherQuickActions", () => {
  it("prioritizes adding students and keeps secondary actions available", () => {
    render(<TeacherQuickActions />);

    expect(screen.getByRole("heading", { name: "Быстрые действия" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Добавить ученика" })).toHaveClass("bg-blue-600");
    expect(screen.getByRole("button", { name: "Создать программу" })).toHaveClass("bg-white");
    expect(screen.getByRole("button", { name: "Создать задание" })).toHaveClass("bg-white");
  });

  it.each(["Добавить ученика", "Создать программу", "Создать задание"])("opens the existing dialog: %s", (name) => {
    render(<TeacherQuickActions />);

    fireEvent.click(screen.getByRole("button", { name }));

    expect(screen.getByRole("dialog", { name })).toBeInTheDocument();
  });
});
