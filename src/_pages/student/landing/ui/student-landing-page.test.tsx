import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { StudentLandingPage } from "./student-landing-page";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("StudentLandingPage", () => {
  it("replaces the workspace placeholder with useful student destinations", () => {
    render(<StudentLandingPage />);

    expect(screen.queryByText("Student Workspace")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Добро пожаловать!" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Мои программы/ })).toHaveAttribute("href", "/student/programs");
    expect(screen.getByRole("link", { name: /Домашние задания/ })).toHaveAttribute("href", "/student/homework");
  });
});
