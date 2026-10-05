import { BookOpenText, CalendarDays, ChevronRight } from "lucide-react";
import Link from "next/link";

import type { StudentProgramSummary } from "../api/student-program-queries";
import { formatProgramDate, programStatusLabels } from "../model/student-program-labels";

const statusClassNames: Record<StudentProgramSummary["status"], string> = {
  ACTIVE: "bg-success-subtle text-success",
  PAUSED: "bg-warning-subtle text-warning",
  COMPLETED: "bg-primary-subtle text-primary",
  ARCHIVED: "bg-surface-subtle text-foreground-muted",
};

export function StudentProgramList({
  programs,
  getProgramHref,
}: Readonly<{
  programs: StudentProgramSummary[];
  getProgramHref?: (programId: string) => string;
}>) {
  return (
    <ul className="min-w-0 divide-y divide-border">
      {programs.map((program) => {
        const content = (
          <>
            <span className="flex min-w-0 items-center gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-surface bg-surface-subtle text-foreground-muted">
                <BookOpenText size={19} />
              </span>

              <span className="min-w-0">
                <span className="block truncate font-semibold text-foreground">{program.title}</span>

                <span className="mt-1 flex flex-wrap items-center gap-2 text-sm text-foreground-muted">
                  <span>{program.subject.name}</span>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays size={14} />
                    Начата {formatProgramDate(program.startedAt)}
                  </span>
                </span>
              </span>
            </span>

            <span className="flex items-center gap-3">
              <span className={`badge  ${statusClassNames[program.status]}`}>
                {programStatusLabels[program.status]}
              </span>

              {getProgramHref && (
                <ChevronRight
                  size={18}
                  className="text-foreground-subtle transition group-hover:translate-x-0.5 group-hover:text-primary"
                />
              )}
            </span>
          </>
        );
        const className = [
          "flex min-w-0 flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between",
          getProgramHref ? "group transition hover:bg-surface-subtle" : "",
        ].join(" ");

        return (
          <li key={program.id}>
            {getProgramHref ? (
              <Link className={className} href={getProgramHref(program.id)}>
                {content}
              </Link>
            ) : (
              <div className={className}>{content}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
