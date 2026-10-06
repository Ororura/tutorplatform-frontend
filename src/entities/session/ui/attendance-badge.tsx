import { Check, Minus, X } from "lucide-react";
import { Badge, type BadgeTone } from "@/shared/ui/badge";
import { attendancePresentation } from "../model/session-presentation";
import type { AttendanceStatus } from "../api/session-queries";
const tones: Record<AttendanceStatus, BadgeTone> = { ATTENDED: "success", MISSED: "warning", CANCELLED: "neutral" };
const icons = { ATTENDED: Check, MISSED: X, CANCELLED: Minus };
export function AttendanceBadge({ status }: Readonly<{ status: AttendanceStatus }>) {
  const Icon = icons[status];
  return (
    <Badge tone={tones[status]}>
      <Icon size={13} aria-hidden="true" />
      {attendancePresentation[status].label}
    </Badge>
  );
}
