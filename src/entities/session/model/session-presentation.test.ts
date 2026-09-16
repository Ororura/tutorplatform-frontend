import { describe, expect, it } from "vitest";
import {
  attendancePresentation,
  formatSessionDateTime,
  formatSessionDuration,
  localDateTimeToIso,
} from "./session-presentation";

describe("session presentation", () => {
  it.each([
    ["ATTENDED", "Проведено"],
    ["MISSED", "Пропущено"],
    ["CANCELLED", "Отменено"],
  ] as const)("maps %s", (status, label) => expect(attendancePresentation[status].label).toBe(label));
  it("formats date-time through the shared Russian formatter", () =>
    expect(formatSessionDateTime("2026-09-14T13:30:00Z")).toMatch(/14 сентября.*\d{2}:\d{2}/));
  it("formats duration", () => expect(formatSessionDuration(90)).toBe("90 мин"));
  it("serializes local wall time as the equivalent ISO instant", () => {
    const expected = new Date(2026, 8, 14, 16, 30).toISOString();
    expect(localDateTimeToIso("2026-09-14T16:30")).toBe(expected);
  });
});
