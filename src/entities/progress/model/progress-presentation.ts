const percentageFormatter = new Intl.NumberFormat("ru-RU", {
  style: "percent",
  maximumFractionDigits: 1,
});

const averageFormatter = new Intl.NumberFormat("ru-RU", {
  maximumFractionDigits: 1,
});

function isMissing(value: number | null | undefined): value is null | undefined {
  return value === null || value === undefined;
}

export function formatProgressValue(value: number | null | undefined, suffix = ""): string {
  return isMissing(value) ? "—" : `${value}${suffix}`;
}

export function formatLearningDuration(minutes: number | null | undefined): string {
  if (isMissing(minutes)) return "—";

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes > 0 ? `${hours} ч ${remainingMinutes} мин` : `${hours} ч`;
}

export function formatAttendanceRate(value: number | null | undefined): string {
  return isMissing(value) ? "—" : percentageFormatter.format(value);
}

export function formatCompletedMetric(completed?: number, assigned?: number): string {
  if (isMissing(completed) && isMissing(assigned)) return "—";
  if (isMissing(assigned)) return String(completed);
  if (isMissing(completed)) return `— из ${assigned}`;
  return `${completed} из ${assigned}`;
}

export function formatAssessmentAverage(value: number | null | undefined): string {
  return isMissing(value) ? "—" : averageFormatter.format(value);
}
