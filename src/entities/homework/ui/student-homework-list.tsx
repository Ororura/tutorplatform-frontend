import { ArrowRight, CalendarDays } from "lucide-react";
import Link from "next/link";

import { buttonClassName } from "@/shared/ui/button";

import type { StudentHomeworkSummary } from "../api/student-homework-queries";
import {
  formatHomeworkItemsCount,
  formatStudentHomeworkDeadline,
  isHomeworkOverdue,
} from "../model/student-homework-presentation";
import { StudentHomeworkIcon, StudentHomeworkStatusBadge } from "./student-homework-primitives";

export function StudentHomeworkList({
  homeworks,
  programTitles,
  now,
}: Readonly<{
  homeworks: StudentHomeworkSummary[];
  programTitles: ReadonlyMap<string, string>;
  now: number;
}>) {
  return (
    <ul className="space-y-3">
      {homeworks.map((homework) => {
        const overdue = isHomeworkOverdue(homework, now);
        const programTitle = programTitles.get(homework.studentProgramId);
        return (
          <li key={homework.id}>
            <article
              aria-label={homework.title}
              className={`flex min-w-0 flex-col gap-4 rounded-surface border border-border/80 bg-surface p-4  sm:flex-row sm:items-center sm:gap-5 sm:px-5 ${overdue ? "" : "sm:py-3"}`}
            >
              <div className="flex min-w-0 flex-1 items-start gap-4 sm:items-center sm:gap-6">
                <StudentHomeworkIcon />
                <div className="min-w-0 flex-1">
                  <h3 className="wrap-break-word text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                    {homework.title}
                  </h3>
                  <p className="mt-1 wrap-break-word text-sm leading-6 text-foreground-muted">
                    {programTitle && (
                      <>
                        {programTitle}
                        <span aria-hidden="true"> · </span>
                      </>
                    )}
                    {formatHomeworkItemsCount(homework.itemsCount)}
                  </p>
                  <p
                    className={`mt-1 flex items-start gap-2 text-sm leading-6 ${overdue ? "text-danger" : "text-foreground-muted"}`}
                  >
                    <CalendarDays size={17} className="mt-1 shrink-0" aria-hidden="true" />
                    <span>
                      {homework.dueAt ? (
                        <>
                          {overdue ? "Срок был " : "До "}
                          <time dateTime={homework.dueAt}>{formatStudentHomeworkDeadline(homework.dueAt, now)}</time>
                        </>
                      ) : (
                        "Без срока"
                      )}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
                {overdue && <StudentHomeworkStatusBadge state="OVERDUE" />}
                <Link
                  href={`/student/homework/${homework.id}`}
                  aria-label={`Открыть: ${homework.title}`}
                  className={buttonClassName(
                    overdue ? "primary" : "ghost",
                    `w-full gap-2 sm:w-auto ${overdue ? "" : "bg-primary-subtle text-primary hover:bg-primary-subtle"}`,
                  )}
                >
                  Открыть <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
