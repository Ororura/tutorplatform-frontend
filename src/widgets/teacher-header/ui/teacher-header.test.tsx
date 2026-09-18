import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TeacherHeader } from "./teacher-header";

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
      roles: ["TEACHER"],
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
});
