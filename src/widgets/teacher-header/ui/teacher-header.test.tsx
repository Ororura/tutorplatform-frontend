import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TeacherHeader } from "./teacher-header";

const { roles, route } = vi.hoisted(() => ({
  roles: {
    current: ["TEACHER"] as string[],
  },
  route: {
    current: "/teacher/students/student-1",
  },
}));

afterEach(() => {
  roles.current = ["TEACHER"];
  route.current = "/teacher/students/student-1";
});

vi.mock("next/navigation", () => ({
  usePathname: () => route.current,
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/entities/user", () => ({
  useCurrentUserQuery: () => ({
    data: {
      id: "user-1",
      displayName: "Анна Ковалева",
      email: "teacher@example.com",
      roles: roles.current,
    },
  }),
}));

vi.mock("@/features/auth/logout", () => ({
  LogoutButton: () => <button type="button">Выйти</button>,
}));

describe("TeacherHeader", () => {
  it("links the brand and homepage navigation to the teacher workspace", () => {
    route.current = "/teacher";

    render(<TeacherHeader />);

    expect(screen.getByRole("link", { name: /Умнее Вместе/ })).toHaveAttribute("href", "/teacher");

    const homeLinks = screen.getAllByRole("link", { name: /Главная/ });

    expect(homeLinks).toHaveLength(2);
    expect(homeLinks.every((link) => link.getAttribute("aria-current") === "page")).toBe(true);
  });

  it("does not mark the homepage active on a nested teacher route", () => {
    render(<TeacherHeader />);

    expect(screen.getAllByRole("link", { name: /Главная/ }).some((link) => link.hasAttribute("aria-current"))).toBe(
      false,
    );
    expect(
      screen.getAllByRole("link", { name: /Ученики/ }).some((link) => link.getAttribute("aria-current") === "page"),
    ).toBe(true);
  });

  it("renders teacher navigation and current user", () => {
    render(<TeacherHeader />);

    expect(screen.getByText("Анна Ковалева")).toBeInTheDocument();

    expect(
      screen.getAllByRole("link", {
        name: /Ученики/,
      })[0],
    ).toHaveAttribute("href", "/teacher/students");

    expect(
      screen.getAllByRole("link", {
        name: /Программы/,
      })[0],
    ).toHaveAttribute("href", "/teacher/programs");

    expect(
      screen.getAllByRole("link", {
        name: /Задания/,
      })[0],
    ).toHaveAttribute("href", "/teacher/tasks");
  });

  it("marks nested student route as active", () => {
    render(<TeacherHeader />);

    const studentLinks = screen.getAllByRole("link", {
      name: /Ученики/,
    });

    expect(studentLinks.some((link) => link.getAttribute("aria-current") === "page")).toBe(true);
  });
  it("does not show admin navigation to a regular teacher", () => {
    roles.current = ["TEACHER"];

    render(<TeacherHeader />);

    expect(
      screen.queryByRole("link", {
        name: "Администрирование",
      }),
    ).not.toBeInTheDocument();
  });

  it("shows admin navigation when teacher also has ADMIN role", () => {
    roles.current = ["TEACHER", "ADMIN"];

    render(<TeacherHeader />);

    const adminLinks = screen.getAllByRole("link", {
      name: "Администрирование",
    });

    expect(adminLinks).toHaveLength(2);

    for (const link of adminLinks) {
      expect(link).toHaveAttribute("href", "/admin");
    }
  });

  it("keeps the full desktop navigation behind the wide-screen breakpoint", () => {
    roles.current = ["TEACHER", "ADMIN"];

    render(<TeacherHeader />);

    expect(screen.getByRole("navigation", { name: "Навигация преподавателя" })).toHaveClass("xl:flex");
    expect(screen.getByRole("navigation", { name: "Мобильная навигация преподавателя" })).toHaveClass("xl:hidden");

    const desktopAdminLink = screen
      .getAllByRole("link", { name: "Администрирование" })
      .find((link) => link.classList.contains("hidden"));

    expect(desktopAdminLink).toHaveClass("xl:inline-flex");
  });
});
