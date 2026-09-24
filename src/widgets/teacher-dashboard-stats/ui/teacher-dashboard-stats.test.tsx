import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { TeacherDashboard } from "@/entities/dashboard";

import { TeacherDashboardStats } from "./teacher-dashboard-stats";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const dashboard: TeacherDashboard = {
  activeStudentsCount: 12,
  needsReviewSubmissionsCount: 3,
  overdueHomeworksCount: 2,
  completedLearningPeriodsWithoutPublishedReportCount: 4,
  attentionItems: [],
};

describe("TeacherDashboardStats", () => {
  it("renders all aggregate cards with navigation", () => {
    render(<TeacherDashboardStats data={dashboard} />);

    expect(screen.getByRole("link", { name: /12\s*Активные ученики/ })).toHaveAttribute("href", "/teacher/students");
    expect(screen.getByRole("link", { name: /3\s*Ожидают проверки/ })).toHaveAttribute("href", "#teacher-attention");
    expect(screen.getByRole("link", { name: /2\s*Просроченные задания/ })).toHaveAttribute(
      "href",
      "#teacher-attention",
    );
    expect(screen.getByRole("link", { name: /4\s*Готовые отчётные периоды/ })).toHaveAttribute(
      "href",
      "#teacher-attention",
    );
  });
});
