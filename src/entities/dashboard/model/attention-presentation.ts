import type { TeacherDashboardAttentionItem } from "../api/dashboard-queries";

const priority = { SUBMISSION_NEEDS_REVIEW: 0, HOMEWORK_OVERDUE: 1, LEARNING_PERIOD_REPORT_MISSING: 2 };

export function sortAttentionItems(items: TeacherDashboardAttentionItem[]) {
  return [...items].sort(
    (a, b) =>
      priority[a.type] - priority[b.type] ||
      Date.parse(a.eventAt) - Date.parse(b.eventAt) ||
      a.resourceId.localeCompare(b.resourceId),
  );
}

export function getAttentionPresentation(item: TeacherDashboardAttentionItem) {
  const base = `/teacher/students/${item.studentId}`;
  switch (item.type) {
    case "SUBMISSION_NEEDS_REVIEW":
      return {
        title: "Работа ожидает проверки",
        detail: item.taskTitle ?? item.homeworkTitle,
        dateLabel: "Отправлено",
        href: `${base}/submissions/${item.navigation.submissionId ?? item.resourceId}`,
      };
    case "HOMEWORK_OVERDUE":
      return {
        title: "Просрочено домашнее задание",
        detail: item.homeworkTitle,
        dateLabel: "Дедлайн",
        href: `${base}/homework/${item.navigation.homeworkId ?? item.resourceId}`,
      };
    case "LEARNING_PERIOD_REPORT_MISSING":
      return {
        title: "Отчётный период готов",
        detail: undefined,
        dateLabel: "Завершён",
        href: item.navigation.reportId
          ? `${base}/reports/${item.navigation.reportId}`
          : `${base}/reports?studentProgramId=${item.navigation.studentProgramId}&learningPeriodId=${item.navigation.learningPeriodId ?? item.resourceId}#learning-period-${item.navigation.learningPeriodId ?? item.resourceId}`,
      };
  }
}
