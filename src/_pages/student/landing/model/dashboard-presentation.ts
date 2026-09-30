export { isHomeworkOverdue, formatStudentHomeworkDeadline as formatDashboardDeadline } from "@/entities/homework";
export { getTopicCompletion } from "@/entities/progress";

export function getDeadlineHint(dueAt: string, now: number) {
  const difference = Date.parse(dueAt) - now;
  const days = Math.floor(Math.abs(difference) / 86_400_000);
  if (difference < 0) return days > 0 ? `Просрочено: ${days} дн.` : "Срок уже прошёл";
  if (days > 0) return `До срока: ${days} дн.`;
  const hours = Math.floor(difference / 3_600_000);
  return hours > 0 ? `До срока: ${hours} ч.` : "До срока меньше часа";
}
