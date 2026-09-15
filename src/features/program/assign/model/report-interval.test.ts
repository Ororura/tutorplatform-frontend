import { describe, expect, it } from "vitest";

import { DEFAULT_REPORT_INTERVAL_HOURS, reportHoursToMinutes } from "./report-interval";

describe("reportHoursToMinutes", () => {
  it("keeps the default in one presentation constant", () => {
    expect(DEFAULT_REPORT_INTERVAL_HOURS).toBe(8);
    expect(reportHoursToMinutes(DEFAULT_REPORT_INTERVAL_HOURS)).toBe(480);
  });

  it("supports half hours without fractional minutes", () => {
    expect(reportHoursToMinutes(1.5)).toBe(90);
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY, 0.001])("rejects invalid hours: %s", (hours) => {
    expect(reportHoursToMinutes(hours)).toBeNull();
  });
});
