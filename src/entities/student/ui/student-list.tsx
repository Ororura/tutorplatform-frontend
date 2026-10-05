import { CalendarDays, ChevronRight } from "lucide-react";
import Link from "next/link";

import type { StudentSummary } from "../api/student-queries";
import { getStudentAccountStatusLabel, getStudentStatusLabel } from "../lib/student-labels";

function getStudentInitials(student: StudentSummary) {
  return `${student.firstName[0] ?? ""}${student.lastName?.[0] ?? ""}`.toUpperCase();
}

export function StudentList({
  students,
}: Readonly<{
  students: StudentSummary[];
}>) {
  return (
    <ul className="divide-y divide-(--border) divide-border">
      {students.map((student) => (
        <li key={student.id}>
          <Link
            className="group grid gap-3 px-2 py-3 transition hover:bg-surface/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] sm:items-center sm:px-3"
            href={`/teacher/students/${student.id}`}
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-subtle text-sm font-semibold text-foreground-muted">
                {getStudentInitials(student)}
              </span>

              <span className="min-w-0">
                <span className="block truncate font-medium text-foreground">
                  {student.firstName} {student.lastName ?? ""}
                </span>

                <span className="mt-1 flex items-center gap-1.5 text-xs text-foreground-muted">
                  <CalendarDays size={14} aria-hidden="true" />
                  Добавлен {new Date(student.createdAt).toLocaleDateString("ru-RU")}
                </span>
              </span>
            </span>

            <span className="flex flex-wrap gap-2">
              <span className="badge bg-success-subtle text-success">{getStudentStatusLabel(student.status)}</span>

              <span className="badge bg-primary-subtle text-primary">
                {getStudentAccountStatusLabel(student.accountStatus)}
              </span>
            </span>

            <span className="flex items-center gap-2 text-sm font-medium text-foreground-muted group-hover:text-primary">
              Открыть
              <ChevronRight aria-hidden="true" size={17} className="transition group-hover:translate-x-0.5" />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
