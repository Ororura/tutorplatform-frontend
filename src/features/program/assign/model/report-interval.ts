export const DEFAULT_REPORT_INTERVAL_HOURS = 8;

export function reportHoursToMinutes(hours: number): number | null {
  const minutes = hours * 60;
  return Number.isFinite(hours) && hours > 0 && Number.isInteger(minutes) ? minutes : null;
}
