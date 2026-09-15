import type { AttendanceStatus } from "../api/session-queries";

export const attendancePresentation: Record<AttendanceStatus, { label: string; icon: string; className: string }> = {
  ATTENDED: { label: "Проведено", icon: "✓", className: "bg-emerald-50 text-emerald-800" },
  MISSED: { label: "Пропущено", icon: "!", className: "bg-amber-50 text-amber-800" },
  CANCELLED: { label: "Отменено", icon: "×", className: "bg-neutral-100 text-neutral-700" },
};

export function formatSessionDateTime(value: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatSessionDuration(minutes: number): string {
  return `${minutes} мин`;
}

export function localDateTimeToIso(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) throw new Error("Invalid local date-time");
  const [, year, month, day, hour, minute] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
  if (Number.isNaN(date.getTime())) throw new Error("Invalid local date-time");
  return date.toISOString();
}

export function isoToLocalDateTime(value: string): string {
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
