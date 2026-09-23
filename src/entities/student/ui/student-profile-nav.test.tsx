import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { StudentProfileNav } from "./student-profile-nav";

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

describe("StudentProfileNav", () => {
  it("links the program tab to the student program overview", () => {
    render(<StudentProfileNav studentId="student-1" active="program" />);

    const link = screen.getByRole("link", {
      name: "Программа",
    });

    expect(link).toHaveAttribute("href", "/teacher/students/student-1/program");

    expect(link).toHaveAttribute("aria-current", "page");
  });

  it("links the progress tab to the student progress page", () => {
    render(<StudentProfileNav studentId="student-1" active="progress" />);

    const link = screen.getByRole("link", { name: "Прогресс" });

    expect(link).toHaveAttribute("href", "/teacher/students/student-1/progress");
    expect(link).toHaveAttribute("aria-current", "page");
  });

  it("links the reports tab to the student reports page", () => {
    render(<StudentProfileNav studentId="student-1" active="reports" />);

    expect(screen.getByRole("link", { name: "Отчёты" })).toHaveAttribute("href", "/teacher/students/student-1/reports");
  });
});
