import type { StudentHomeworkDetails, StudentHomeworkSummary } from "../api/student-homework-queries";

type StudentHomework = StudentHomeworkSummary | StudentHomeworkDetails;

export type StudentHomeworkPresentationState = StudentHomework["status"] | "OVERDUE";

export function getStudentHomeworkPresentationState(homework: Pick<StudentHomework, "status" | "overdue">) {
  return homework.status === "ASSIGNED" && homework.overdue ? "OVERDUE" : homework.status;
}

export const studentHomeworkStatusPresentation: Record<StudentHomeworkPresentationState, string> = {
  ASSIGNED: "Нужно выполнить",
  OVERDUE: "Просрочено",
  COMPLETED: "Выполнено",
  CANCELLED: "Отменено",
};
