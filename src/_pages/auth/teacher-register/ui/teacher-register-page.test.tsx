import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { useQueryMock } = vi.hoisted(() => ({
  useQueryMock: vi.fn(),
}));

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();

  return {
    ...actual,
    useQuery: useQueryMock,
  };
});

vi.mock("@/entities/user", () => ({
  GuestGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/features/auth/register-teacher", () => ({
  RegisterTeacherForm: () => <div data-testid="registration-form">Registration form</div>,
}));

import { TeacherRegisterPage } from "./teacher-register-page";

afterEach(() => {
  cleanup();
  useQueryMock.mockReset();
});

describe("TeacherRegisterPage", () => {
  it("shows registration form in OPEN mode", () => {
    useQueryMock.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        registrationMode: "OPEN",
      },
    });

    render(<TeacherRegisterPage />);

    expect(screen.getByTestId("registration-form")).toBeInTheDocument();
  });

  it("hides registration form in INVITE_ONLY mode", () => {
    useQueryMock.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        registrationMode: "INVITE_ONLY",
      },
    });

    render(<TeacherRegisterPage />);

    expect(screen.queryByTestId("registration-form")).not.toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: "Регистрация по приглашению",
      }),
    ).toBeInTheDocument();
  });

  it("shows an error instead of registration form when settings fail", () => {
    useQueryMock.mockReturnValue({
      isPending: false,
      isError: true,
      data: undefined,
      refetch: vi.fn(),
    });

    render(<TeacherRegisterPage />);

    expect(screen.queryByTestId("registration-form")).not.toBeInTheDocument();

    expect(screen.getByRole("alert")).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Повторить",
      }),
    ).toBeInTheDocument();
  });
});
