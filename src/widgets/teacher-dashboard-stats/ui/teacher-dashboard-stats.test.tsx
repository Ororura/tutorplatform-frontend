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
  it.each([
    dashboard,
    {
      ...dashboard,
      activeStudentsCount: 0,
      needsReviewSubmissionsCount: 0,
      overdueHomeworksCount: 0,
      completedLearningPeriodsWithoutPublishedReportCount: 0,
    },
  ])("preserves aggregate values and navigation: %j", (data) => {
    render(<TeacherDashboardStats data={data} />);

    expect(
      screen.getByRole("link", { name: new RegExp(`${data.activeStudentsCount}\\s*Активные ученики`) }),
    ).toHaveAttribute("href", "/teacher/students");
    expect(
      screen.getByRole("link", { name: new RegExp(`${data.needsReviewSubmissionsCount}\\s*Ожидают проверки`) }),
    ).toHaveAttribute("href", "#teacher-attention");
    expect(
      screen.getByRole("link", { name: new RegExp(`${data.overdueHomeworksCount}\\s*Просроченные задания`) }),
    ).toHaveAttribute("href", "#teacher-attention");
    expect(
      screen.getByRole("link", {
        name: new RegExp(`${data.completedLearningPeriodsWithoutPublishedReportCount}\\s*Готовые отчётные периоды`),
      }),
    ).toHaveAttribute("href", "#teacher-attention");
  });
});
