import { describe, expect, it } from "vitest";

import {
  formatReportAssessment,
  formatReportLearningDuration,
  formatReportPeriod,
  progressReportStatusLabels,
} from "./report-presentation";

describe("report presentation", () => {
  it("formats status, period and learning time for the reports list", () => {
    expect(progressReportStatusLabels.PUBLISHED).toBe("Опубликован");
    expect(formatReportLearningDuration(125)).toBe("2 ч 5 мин");
    expect(formatReportPeriod("2026-09-01T10:00:00Z", "2026-09-15T10:00:00Z")).toMatch(/1 сент.*15 сент/);
  });

  it("does not show a missing assessment as zero", () => {
    expect(formatReportAssessment(null)).toBe("—");
  });
});
