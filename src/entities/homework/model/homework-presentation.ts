import type { HomeworkStatus } from "../api/homework-queries";

export type HomeworkPresentationState = HomeworkStatus | "OVERDUE";

export function getHomeworkPresentationState(homework: {
  status: HomeworkStatus;
  overdue: boolean;
}): HomeworkPresentationState {
  return homework.status === "ASSIGNED" && homework.overdue ? "OVERDUE" : homework.status;
}

export const homeworkStatusPresentation: Record<HomeworkPresentationState, string> = {
  ASSIGNED: "Назначено",
  OVERDUE: "Просрочено",
  COMPLETED: "Выполнено",
  CANCELLED: "Отменено",
};

export function formatHomeworkDate(value: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
