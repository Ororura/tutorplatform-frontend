import Link from "next/link";

import type { LessonSessionSummary } from "../api/session-queries";
import { formatSessionDateTime, formatSessionDuration } from "../model/session-presentation";
import { AttendanceBadge } from "./attendance-badge";

export function SessionList({
  sessions,
  studentId,
}: Readonly<{ sessions: LessonSessionSummary[]; studentId: string }>) {
  return (
    <ol className="divide-y divide-neutral-200 overflow-hidden rounded-lg border border-neutral-200 bg-white">
      {sessions.map((session) => (
        <li key={session.id}>
          <Link
            className="block p-5 transition hover:bg-neutral-50"
            href={`/teacher/students/${studentId}/sessions/${session.id}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{formatSessionDateTime(session.startedAt)}</p>
                <p className="mt-1 text-sm text-neutral-600">
                  {formatSessionDuration(session.durationMinutes)}
                  {session.topics.length > 0 ? ` · Тем: ${session.topics.length}` : ""}
                </p>
              </div>
              <AttendanceBadge status={session.attendanceStatus} />
            </div>
            {session.summary && <p className="mt-3 line-clamp-2 text-sm text-neutral-700">{session.summary}</p>}
            <span className="mt-3 inline-block text-sm font-medium underline underline-offset-4">Открыть занятие</span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
