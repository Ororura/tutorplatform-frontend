import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { StudentHeader } from "./student-header";

vi.mock("next/navigation", () => ({
  usePathname: () => "/student/homework",
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/entities/user/api/current-user", () => ({
  useCurrentUserQuery: () => ({
    data: {
      id: "student-1",
      displayName: "Мария Иванова",
      email: "student@example.com",
      roles: ["STUDENT"],
    },
  }),
}));

vi.mock("@/features/auth/logout", () => ({
  LogoutButton: () => <button type="button">Выйти</button>,
}));

describe("StudentHeader", () => {
  it("renders student identity and responsive workspace navigation", () => {
    render(<StudentHeader />);

    expect(screen.getByText("Мария Иванова")).toBeInTheDocument();
    expect(screen.getByText("МИ")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Умнее Вместе/ })).toHaveAttribute("href", "/student");
    expect(screen.getAllByRole("link", { name: "Главная" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Мои программы" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Домашние задания" })).toHaveLength(2);
    expect(screen.getByRole("navigation", { name: "Мобильная навигация ученика" })).toBeInTheDocument();
  });
});
