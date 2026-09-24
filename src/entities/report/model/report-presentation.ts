import type { ProgressReportSummary } from "../api/report-queries";

export type ProgressReportStatus = ProgressReportSummary["status"];

export const progressReportStatusLabels: Record<ProgressReportStatus, string> = {
  DRAFT: "Черновик",
  PUBLISHED: "Опубликован",
  ARCHIVED: "В архиве",
};

export const progressReportStatusClassNames: Record<ProgressReportStatus, string> = {
  DRAFT: "bg-amber-50 text-amber-700",
  PUBLISHED: "bg-emerald-50 text-emerald-700",
  ARCHIVED: "bg-slate-100 text-slate-600",
};

const dateFormatter = new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium" });

export function formatReportDate(value: string): string {
  return dateFormatter.format(new Date(value));
}

export function formatReportPeriod(startedAt: string, endedAt: string): string {
  return `${formatReportDate(startedAt)} — ${formatReportDate(endedAt)}`;
}

export function formatReportLearningDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) return `${remainingMinutes} мин`;
  return remainingMinutes === 0 ? `${hours} ч` : `${hours} ч ${remainingMinutes} мин`;
}

const percentageFormatter = new Intl.NumberFormat("ru-RU", {
  style: "percent",
  maximumFractionDigits: 1,
});

const averageFormatter = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 });

export function formatReportAttendance(value?: number): string {
  return value === undefined ? "—" : percentageFormatter.format(value);
}

export function formatReportCompleted(completed?: number, assigned?: number): string {
  if (completed === undefined && assigned === undefined) return "—";
  return `${completed ?? "—"} из ${assigned ?? "—"}`;
}

export function formatReportAssessment(value?: number | null): string {
  return value === null || value === undefined ? "—" : averageFormatter.format(value);
}
