import { describe, expect, it } from "vitest";

import {
  formatHomeworkItemsCount,
  formatStudentHomeworkDeadline,
  getStudentHomeworkPresentationState,
} from "./student-homework-presentation";

const now = new Date(2026, 8, 30, 15).getTime();
describe("student homework presentation", () => {
  it("derives overdue only for unfinished assignments with deadlines strictly before now", () => {
    const homework = { status: "ASSIGNED" as const, dueAt: new Date(now - 1).toISOString() };
    expect(getStudentHomeworkPresentationState(homework, now)).toBe("OVERDUE");
    expect(getStudentHomeworkPresentationState({ ...homework, dueAt: new Date(now).toISOString() }, now)).toBe(
      "ASSIGNED",
    );
    expect(getStudentHomeworkPresentationState({ ...homework, dueAt: null }, now)).toBe("ASSIGNED");
    expect(getStudentHomeworkPresentationState({ ...homework, completedAt: new Date(now).toISOString() }, now)).toBe(
      "ASSIGNED",
    );
    expect(getStudentHomeworkPresentationState({ ...homework, status: "COMPLETED" }, now)).toBe("COMPLETED");
    expect(getStudentHomeworkPresentationState({ ...homework, status: "CANCELLED" }, now)).toBe("CANCELLED");
  });
  it("omits the current year and includes another year using the local deadline time", () => {
    expect(formatStudentHomeworkDeadline(new Date(2026, 8, 24, 18, 0).toISOString(), now)).toBe("24 сентября, 18:00");
    expect(formatStudentHomeworkDeadline(new Date(2027, 0, 3, 9, 5).toISOString(), now)).toMatch(
      /^3 января 2027 г\., 09:05$/,
    );
  });
  it.each([
    [0, "0 заданий"],
    [1, "1 задание"],
    [2, "2 задания"],
    [3, "3 задания"],
    [4, "4 задания"],
    [11, "11 заданий"],
    [14, "14 заданий"],
    [21, "21 задание"],
    [22, "22 задания"],
    [25, "25 заданий"],
    [111, "111 заданий"],
  ])("formats %i items", (count, expected) => expect(formatHomeworkItemsCount(count)).toBe(expected));
});
