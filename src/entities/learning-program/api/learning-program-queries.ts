import { queryOptions } from "@tanstack/react-query";

import { ApiClientError, apiClient } from "@/shared/api/client";
import type { components } from "@/shared/api/generated/schema";

export type LearningProgram = components["schemas"]["LearningProgramSummaryResponse"];
export type LearningProgramStatus = LearningProgram["status"];

export async function getLearningPrograms(status: LearningProgramStatus): Promise<LearningProgram[]> {
  const { data, error, response } = await apiClient.GET("/api/v1/teacher/programs", {
    params: { query: { status } },
  });

  if (error) {
    throw new ApiClientError(response.status, error);
  }

  return data;
}

export const learningProgramQueries = {
  all: () => ["learning-programs"] as const,
  lists: () => [...learningProgramQueries.all(), "list"] as const,
  list: (status: LearningProgramStatus) =>
    queryOptions({
      queryKey: [...learningProgramQueries.lists(), status] as const,
      queryFn: () => getLearningPrograms(status),
    }),
};
