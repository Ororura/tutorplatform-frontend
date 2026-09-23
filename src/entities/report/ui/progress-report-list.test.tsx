import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProgressReportList } from "./progress-report-list";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("ProgressReportList", () => {
  it("shows report metadata and links to the report details", () => {
    render(
      <ProgressReportList
        studentId="student-1"
        reports={[
          {
            id: "report-1",
            studentProgramId: "program-1",
            learningPeriodId: "period-1",
            status: "PUBLISHED",
            periodStartedAt: "2026-09-01T10:00:00Z",
            periodEndedAt: "2026-09-15T10:00:00Z",
            learningMinutes: 125,
            publishedAt: "2026-09-16T10:00:00Z",
            createdAt: "2026-09-16T10:00:00Z",
            updatedAt: "2026-09-16T10:00:00Z",
          },
        ]}
      />,
    );

    expect(screen.getByText("Опубликован")).toBeInTheDocument();
    expect(screen.getByText(/Учебное время: 2 ч 5 мин/)).toBeInTheDocument();
    expect(screen.getByText(/Опубликован 16 сент/)).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/teacher/students/student-1/reports/report-1");
  });
});
