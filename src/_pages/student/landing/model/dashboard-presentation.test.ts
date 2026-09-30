import { describe, expect, it } from "vitest";

import {
  formatDashboardDeadline,
  getDeadlineHint,
  getTopicCompletion,
  isHomeworkOverdue,
} from "./dashboard-presentation";

const now = Date.parse("2026-09-30T12:00:00Z");
const homework = {
  id: "hw",
  studentProgramId: "program",
  title: "Задание",
  status: "ASSIGNED" as const,
  overdue: false,
  dueAt: "2026-09-28T12:00:00Z",
  assignedAt: "2026-09-01T12:00:00Z",
  createdAt: "2026-09-01T12:00:00Z",
  itemsCount: 1,
};

describe("dashboard presentation", () => {
  it("derives overdue only for active, unfinished homework with a past deadline", () => {
    expect(isHomeworkOverdue(homework, now)).toBe(true);
    expect(isHomeworkOverdue({ ...homework, dueAt: null }, now)).toBe(false);
    expect(isHomeworkOverdue({ ...homework, dueAt: new Date(now).toISOString() }, now)).toBe(false);
    expect(isHomeworkOverdue({ ...homework, status: "COMPLETED" }, now)).toBe(false);
    expect(isHomeworkOverdue({ ...homework, status: "CANCELLED" }, now)).toBe(false);
    expect(isHomeworkOverdue({ ...homework, completedAt: new Date(now).toISOString() }, now)).toBe(false);
  });
  it("formats compact dates and relative deadline hints without invented dates", () => {
    expect(formatDashboardDeadline(new Date(now + 3_600_000).toISOString(), now)).toMatch(/^30 сентября, \d{2}:\d{2}$/);
    expect(getDeadlineHint(new Date(now - 2 * 86_400_000).toISOString(), now)).toBe("Просрочено: 2 дн.");
    expect(getDeadlineHint(new Date(now + 3 * 86_400_000).toISOString(), now)).toBe("До срока: 3 дн.");
    expect(getDeadlineHint(new Date(now + 2 * 3_600_000).toISOString(), now)).toBe("До срока: 2 ч.");
  });
  it("requires both real total and completed topics before showing percentages", () => {
    expect(getTopicCompletion()).toBeUndefined();
    expect(getTopicCompletion({ totalTopics: 18 })).toBeUndefined();
    expect(getTopicCompletion({ totalTopics: 0, topics: { completed: [] } })).toBeUndefined();
    expect(getTopicCompletion({ totalTopics: 1, topics: { completed: [{}, {}] } })).toBeUndefined();
    expect(getTopicCompletion({ totalTopics: 3, topics: { completed: [{}] } })).toEqual({
      completed: 1,
      total: 3,
      percent: 33,
    });
    expect(getTopicCompletion({ totalTopics: 3, topics: { completed: [] } })).toEqual({
      completed: 0,
      total: 3,
      percent: 0,
    });
  });
});
