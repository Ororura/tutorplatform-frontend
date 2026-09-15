import { attendancePresentation } from "../model/session-presentation";
import type { AttendanceStatus } from "../api/session-queries";

export function AttendanceBadge({ status }: Readonly<{ status: AttendanceStatus }>) {
  const presentation = attendancePresentation[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-medium ${presentation.className}`}>
      <span aria-hidden="true">{presentation.icon}</span>{presentation.label}
    </span>
  );
}
