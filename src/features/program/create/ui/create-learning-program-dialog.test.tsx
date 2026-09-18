import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CreateLearningProgramDialog } from "./create-learning-program-dialog";

const mocks = vi.hoisted(() => ({
  useQuery: vi.fn(),
  mutateAsync: vi.fn(),
  refetch: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: mocks.useQuery,
}));

vi.mock("@/entities/task", () => ({
  taskQueries: {
    subjects: () => ({
      queryKey: ["teacher-tasks", "subjects"],
    }),
  },
}));

vi.mock("../api/create-learning-program", () => ({
  useCreateLearningProgramMutation: () => ({
    mutateAsync: mocks.mutateAsync,
    isPending: false,
  }),
}));

describe("CreateLearningProgramDialog", () => {
  beforeEach(() => {
    mocks.mutateAsync.mockReset();
    mocks.refetch.mockReset();

    mocks.useQuery.mockReturnValue({
      data: [
        {
          id: "subject-1",
          name: "Python",
          status: "ACTIVE",
        },
      ],
      isPending: false,
      isError: false,
      refetch: mocks.refetch,
    });

    mocks.mutateAsync.mockResolvedValue({
      id: "program-1",
      title: "Python с нуля",
      description: "Базовый курс",
      status: "DRAFT",
      subject: {
        id: "subject-1",
        name: "Python",
      },
      createdAt: "2026-09-18T00:00:00Z",
      updatedAt: "2026-09-18T00:00:00Z",
    });
  });

  it("opens creation dialog", () => {
    render(<CreateLearningProgramDialog />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Создать программу",
      }),
    );

    expect(
      screen.getByRole("dialog", {
        name: "Создать программу",
      }),
    ).toBeInTheDocument();

    expect(screen.getByLabelText("Предмет")).toBeInTheDocument();
    expect(screen.getByLabelText("Название")).toBeInTheDocument();
  });

  it("does not submit without subject", () => {
    render(<CreateLearningProgramDialog />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Создать программу",
      }),
    );

    fireEvent.change(screen.getByLabelText("Название"), {
      target: {
        value: "Python с нуля",
      },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Создать",
      }),
    );

    expect(screen.getByText("Выберите предмет.")).toBeInTheDocument();
    expect(mocks.mutateAsync).not.toHaveBeenCalled();
  });

  it("does not submit without title", () => {
    render(<CreateLearningProgramDialog />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Создать программу",
      }),
    );

    fireEvent.change(screen.getByLabelText("Предмет"), {
      target: {
        value: "subject-1",
      },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Создать",
      }),
    );

    expect(screen.getByText("Введите название программы.")).toBeInTheDocument();
    expect(mocks.mutateAsync).not.toHaveBeenCalled();
  });

  it("submits normalized program data", async () => {
    render(<CreateLearningProgramDialog />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Создать программу",
      }),
    );

    fireEvent.change(screen.getByLabelText("Предмет"), {
      target: {
        value: "subject-1",
      },
    });

    fireEvent.change(screen.getByLabelText("Название"), {
      target: {
        value: "  Python с нуля  ",
      },
    });

    fireEvent.change(screen.getByLabelText(/Описание/), {
      target: {
        value: "  Базовый курс  ",
      },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Создать",
      }),
    );

    await waitFor(() => {
      expect(mocks.mutateAsync).toHaveBeenCalledWith({
        subjectId: "subject-1",
        title: "Python с нуля",
        description: "Базовый курс",
      });
    });
  });

  it("omits empty optional description", async () => {
    render(<CreateLearningProgramDialog />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Создать программу",
      }),
    );

    fireEvent.change(screen.getByLabelText("Предмет"), {
      target: {
        value: "subject-1",
      },
    });

    fireEvent.change(screen.getByLabelText("Название"), {
      target: {
        value: "Python с нуля",
      },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Создать",
      }),
    );

    await waitFor(() => {
      expect(mocks.mutateAsync).toHaveBeenCalledWith({
        subjectId: "subject-1",
        title: "Python с нуля",
      });
    });
  });
});
