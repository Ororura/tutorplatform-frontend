import type { StudentHomeworkSummary } from "@/entities/homework";
import type { CurrentProgress } from "@/entities/progress";

export function isHomeworkOverdue(homework: StudentHomeworkSummary, now: number) {
  return (
    homework.status === "ASSIGNED" && !homework.completedAt && !!homework.dueAt && Date.parse(homework.dueAt) < now
  );
}

export function formatDashboardDeadline(dueAt: string, now: number) {
  const date = new Date(dueAt);
  const today = date.toDateString() === new Date(now).toDateString();
  return today
    ? `Сегодня, ${new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" }).format(date)}`
    : new Intl.DateTimeFormat("ru-RU", { dateStyle: "long", timeStyle: "short" }).format(date);
}

export function getDeadlineHint(dueAt: string, now: number) {
  const difference = Date.parse(dueAt) - now;
  const days = Math.floor(Math.abs(difference) / 86_400_000);
  if (difference < 0) return days > 0 ? `Просрочено: ${days} дн.` : "Срок уже прошёл";
  if (days > 0) return `До срока: ${days} дн.`;
  const hours = Math.floor(difference / 3_600_000);
  return hours > 0 ? `До срока: ${hours} ч.` : "До срока меньше часа";
}

export function getTopicCompletion(progress?: CurrentProgress) {
  const total = progress?.totalTopics;
  const completed = progress?.topics?.completed?.length;
  if (total === undefined || completed === undefined || total <= 0 || completed > total) return undefined;
  return { completed, total, percent: Math.round((completed / total) * 100) };
}
