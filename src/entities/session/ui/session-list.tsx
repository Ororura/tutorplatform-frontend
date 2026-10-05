import { CalendarClock, ChevronRight, Clock3 } from "lucide-react";
import Link from "next/link";

import type { LessonSessionSummary } from "../api/session-queries";
import { formatSessionDateTime, formatSessionDuration } from "../model/session-presentation";
import { AttendanceBadge } from "./attendance-badge";

export function SessionList({
  sessions,
  studentId,
}: Readonly<{
  sessions: LessonSessionSummary[];
  studentId: string;
}>) {
  return (
    <ol className="divide-y divide-border">
      {sessions.map((session) => (
        <li key={session.id}>
          <Link
            className="group flex flex-col gap-4 px-2 py-5 transition hover:bg-surface-subtle/70 sm:flex-row sm:items-center"
            href={`/teacher/students/${studentId}/sessions/${session.id}`}
          >
            <span className="flex min-w-0 flex-1 items-start gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-surface bg-primary-subtle text-primary">
                <CalendarClock size={19} />
              </span>

              <span className="min-w-0">
                <span className="block font-semibold text-foreground">{formatSessionDateTime(session.startedAt)}</span>

                <span className="mt-1 flex flex-wrap items-center gap-2 text-sm text-foreground-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 size={14} />
                    {formatSessionDuration(session.durationMinutes)}
                  </span>

                  {session.topics.length > 0 && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>Тем: {session.topics.length}</span>
                    </>
                  )}
                </span>

                {session.summary && (
                  <span className="mt-2 block line-clamp-2 text-sm leading-6 text-foreground-muted">
                    {session.summary}
                  </span>
                )}
              </span>
            </span>

            <span className="flex shrink-0 items-center gap-3">
              <AttendanceBadge status={session.attendanceStatus} />

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
