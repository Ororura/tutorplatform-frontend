import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AdminHeader } from "./admin-header";

const { pathnameMock, currentUserMock } = vi.hoisted(() => ({
  pathnameMock: vi.fn(),
  currentUserMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: pathnameMock,
}));

vi.mock("@/entities/user", () => ({
  useCurrentUserQuery: currentUserMock,
}));

vi.mock("@/features/auth/logout", () => ({
  LogoutButton: () => <button type="button">Выйти</button>,
}));

afterEach(() => {
  cleanup();

  pathnameMock.mockReset();
  currentUserMock.mockReset();
});

describe("AdminHeader", () => {
  it("renders navigation and administrator account", () => {
    pathnameMock.mockReturnValue("/admin/settings");

    currentUserMock.mockReturnValue({
      data: {
        id: "admin-1",
        displayName: "Тестовый администратор",
        email: "admin@example.com",
        roles: ["ADMIN"],
      },
    });

    render(<AdminHeader />);

    expect(screen.getByText("Тестовый администратор")).toBeInTheDocument();

    expect(screen.getByText("admin@example.com")).toBeInTheDocument();

    expect(
      screen.getAllByRole("link", {
        name: "Настройки",
      })[0],
    ).toHaveAttribute("aria-current", "page");

    expect(
      screen.getAllByRole("link", {
        name: "Приглашения",
      })[0],
    ).toHaveAttribute("href", "/admin/invitations");

    expect(
      screen.getByRole("button", {
        name: "Выйти",
      }),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("link", {
        name: "Кабинет преподавателя",
      }),
    ).not.toBeInTheDocument();
  });

  it("shows teacher area for an administrator with TEACHER role", () => {
    pathnameMock.mockReturnValue("/admin/invitations");

    currentUserMock.mockReturnValue({
      data: {
        id: "admin-teacher-1",
        displayName: "Администратор",
        email: "teacher@example.com",
        roles: ["ADMIN", "TEACHER"],
      },
    });

    render(<AdminHeader />);

    expect(
      screen.getByRole("link", {
        name: "Кабинет преподавателя",
      }),
    ).toHaveAttribute("href", "/teacher/students");

    expect(
      screen.getAllByRole("link", {
        name: "Приглашения",
      })[0],
    ).toHaveAttribute("aria-current", "page");
  });
});
