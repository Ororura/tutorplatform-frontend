import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { StudentNavigation } from "./student-navigation";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/student/programs/program-1",
}));

describe("StudentNavigation", () => {
  it("exposes every student workspace destination", () => {
    render(<StudentNavigation />);

    expect(screen.getByRole("link", { name: "Главная" })).toHaveAttribute("href", "/student");
    expect(screen.getByRole("link", { name: "Мои программы" })).toHaveAttribute("href", "/student/programs");
    expect(screen.getByRole("link", { name: "Домашние задания" })).toHaveAttribute("href", "/student/homework");
    expect(screen.getByRole("link", { name: "Прогресс" })).toHaveAttribute("href", "/student/progress");
  });

  it("marks a nested workspace route as active", () => {
    render(<StudentNavigation />);

    expect(screen.getByRole("link", { name: "Мои программы" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Главная" })).not.toHaveAttribute("aria-current");
  });

  it("provides a dedicated accessible label for mobile navigation", () => {
    render(<StudentNavigation mobile />);

    expect(screen.getByRole("navigation", { name: "Мобильная навигация ученика" })).toBeInTheDocument();
  });
});
