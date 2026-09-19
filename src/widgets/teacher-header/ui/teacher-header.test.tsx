import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TeacherHeader } from "./teacher-header";

const { roles } = vi.hoisted(() => ({
  roles: {
    current: ["TEACHER"] as string[],
  },
}));

afterEach(() => {
  roles.current = ["TEACHER"];
});

vi.mock("next/navigation", () => ({
  usePathname: () => "/teacher/students/student-1",
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
});
