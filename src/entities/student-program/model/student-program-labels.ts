import type { StudentProgramDetails, StudentProgramSummary, TopicProgressStatus } from "../api/student-program-queries";

type ProgramStatus = StudentProgramSummary["status"] | StudentProgramDetails["status"];

export const programStatusLabels: Record<ProgramStatus, string> = {
  ACTIVE: "Активна",
  PAUSED: "Приостановлена",
  COMPLETED: "Завершена",
  ARCHIVED: "В архиве",
};

export const topicProgressPresentation: Record<
  NonNullable<TopicProgressStatus>,
  { label: string; icon: string; className: string }
> = {
  LOCKED: { label: "Заблокирована", icon: "🔒", className: "bg-neutral-100 text-neutral-600" },
  AVAILABLE: { label: "Доступна", icon: "○", className: "bg-blue-50 text-blue-800" },
  IN_PROGRESS: { label: "В процессе", icon: "◐", className: "bg-amber-50 text-amber-800" },
  COMPLETED: { label: "Пройдена", icon: "✓", className: "bg-emerald-50 text-emerald-800" },
};

export function formatProgramDate(value: string): string {
  return new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium" }).format(new Date(value));
}
