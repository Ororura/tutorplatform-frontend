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
  LOCKED: { label: "Заблокирована", icon: "🔒", className: "bg-surface-subtle text-foreground-muted" },
  AVAILABLE: { label: "Доступна", icon: "○", className: "bg-primary-subtle text-primary" },
  IN_PROGRESS: { label: "В процессе", icon: "◐", className: "bg-primary-subtle text-primary" },
  COMPLETED: { label: "Пройдена", icon: "✓", className: "bg-success-subtle text-success" },
};

export function formatProgramDate(value: string): string {
  return new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium" }).format(new Date(value));
}
