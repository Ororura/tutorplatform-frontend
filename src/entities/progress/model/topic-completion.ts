import type { CurrentProgress } from "../api/progress-queries";

export function getTopicCompletion(progress?: CurrentProgress) {
  const total = progress?.totalTopics;
  const completed = progress?.topics?.completed?.length;
  if (total === undefined || completed === undefined || total <= 0 || completed > total) return undefined;
  return { completed, total, percent: Math.round((completed / total) * 100) };
}
