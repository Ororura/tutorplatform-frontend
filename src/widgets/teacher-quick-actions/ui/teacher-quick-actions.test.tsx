import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TeacherQuickActions } from "./teacher-quick-actions";

vi.mock("@/features/student/create", () => ({
  CreateStudentDialog: () => <button type="button">Добавить ученика</button>,
}));

vi.mock("@/features/program/create", () => ({
  CreateLearningProgramDialog: () => <button type="button">Создать программу</button>,
}));

vi.mock("@/features/task/create", () => ({
  CreateTaskDialog: () => <button type="button">Создать задание</button>,
}));

describe("TeacherQuickActions", () => {
  it("reuses every existing teacher creation action", () => {
    render(<TeacherQuickActions />);

    expect(screen.getByRole("heading", { name: "Быстрые действия" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Добавить ученика" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Создать программу" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Создать задание" })).toBeInTheDocument();
  });
});
