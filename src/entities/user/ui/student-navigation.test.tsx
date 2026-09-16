import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

import { StudentNavigation } from "./student-navigation";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

it("exposes homework as the only student navigation destination", () => {
  render(<StudentNavigation />);
  expect(screen.getByRole("link", { name: "Домашние задания" })).toHaveAttribute("href", "/student/homework");
  expect(screen.getAllByRole("link")).toHaveLength(1);
});
