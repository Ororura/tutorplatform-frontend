import type { StudentHomeworkDetails, StudentHomeworkSummary } from "../api/student-homework-queries";

type StudentHomework = StudentHomeworkSummary | StudentHomeworkDetails;

export type StudentHomeworkPresentationState = StudentHomework["status"] | "OVERDUE";

type HomeworkDeadline = Pick<StudentHomework, "status" | "dueAt" | "completedAt">;

export function isHomeworkOverdue(homework: HomeworkDeadline, now: number) {
  return (
    homework.status === "ASSIGNED" && !homework.completedAt && !!homework.dueAt && Date.parse(homework.dueAt) < now
  );
}

export function getStudentHomeworkPresentationState(homework: HomeworkDeadline, now = Date.now()) {
  return isHomeworkOverdue(homework, now) ? "OVERDUE" : homework.status;
}

export function formatStudentHomeworkDeadline(value: string, now: number) {
  const date = new Date(value);
  const day = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    ...(date.getFullYear() !== new Date(now).getFullYear() ? { year: "numeric" as const } : {}),
  }).format(date);
  const time = new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" }).format(date);
  return `${day}, ${time}`;
}

export function formatHomeworkItemsCount(count: number) {
  const ending =
    count % 100 >= 11 && count % 100 <= 14
      ? "заданий"
      : count % 10 === 1
        ? "задание"
        : count % 10 >= 2 && count % 10 <= 4
          ? "задания"
          : "заданий";
  return `${count} ${ending}`;
}

export const studentHomeworkStatusPresentation: Record<StudentHomeworkPresentationState, string> = {
  ASSIGNED: "Нужно выполнить",
  OVERDUE: "Просрочено",
  COMPLETED: "Выполнено",
  CANCELLED: "Отменено",
};
