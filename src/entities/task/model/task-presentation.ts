import type { TaskDifficulty, TaskStatus, TaskType } from "../api/task-queries";

export const taskTypePresentation: Record<TaskType, string> = {
  TEXT: "Текстовый ответ",
  CODE: "Код",
};

export const taskDifficultyPresentation: Record<TaskDifficulty, string> = {
  EASY: "Лёгкая",
  MEDIUM: "Средняя",
  HARD: "Сложная",
};

export const taskStatusPresentation: Record<TaskStatus, string> = {
  DRAFT: "Черновик",
  ACTIVE: "Активно",
  ARCHIVED: "В архиве",
};
