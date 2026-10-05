import { ChevronRight, Clock3, FileText } from "lucide-react";
import Link from "next/link";

import type { ProgressReportSummary } from "../api/report-queries";
import {
  formatReportDate,
  formatReportLearningDuration,
  formatReportPeriod,
  progressReportStatusClassNames,
  progressReportStatusLabels,
} from "../model/report-presentation";

export function ProgressReportList({
  reports,
  studentId,
}: Readonly<{
  reports: ProgressReportSummary[];
  studentId: string;
}>) {
  return (
    <ol className="divide-y divide-border">
      {reports.map((report) => (
        <li key={report.id}>
          <Link
            className="group flex flex-col gap-4 px-2 py-5 transition hover:bg-surface-subtle/70 sm:flex-row sm:items-center"
            href={`/teacher/students/${studentId}/reports/${report.id}`}
          >
            <span className="flex min-w-0 flex-1 items-start gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-surface bg-primary-subtle text-primary">
                <FileText size={19} />
              </span>

              <span className="min-w-0">
                <span className="block font-semibold text-foreground">
                  {formatReportPeriod(report.periodStartedAt, report.periodEndedAt)}
                </span>
                <span className="mt-1 flex flex-wrap items-center gap-2 text-sm text-foreground-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 size={14} />
                    Учебное время: {formatReportLearningDuration(report.learningMinutes)}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {report.publishedAt ? `Опубликован ${formatReportDate(report.publishedAt)}` : "Не опубликован"}
                  </span>
                </span>
              </span>
            </span>

            <span className="flex shrink-0 items-center gap-3">
              <span className={`badge  ${progressReportStatusClassNames[report.status]}`}>
                {progressReportStatusLabels[report.status]}
              </span>
              <ChevronRight
                size={18}
                className="text-foreground-subtle transition group-hover:translate-x-0.5 group-hover:text-primary"
              />
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
