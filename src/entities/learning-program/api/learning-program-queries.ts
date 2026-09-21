import { queryOptions } from "@tanstack/react-query";

import { apiClient, ApiClientError } from "@/shared/api/client";
import type { components } from "@/shared/api/generated/schema";

export type LearningProgram = components["schemas"]["LearningProgramSummaryResponse"];
export type LearningProgramDetails = components["schemas"]["LearningProgramDetailsResponse"];
export type LearningProgramStatus = LearningProgram["status"];
export type CreateLearningProgramRequest = components["schemas"]["CreateLearningProgramRequest"];
export type UpdateLearningProgramRequest = components["schemas"]["UpdateLearningProgramRequest"];

export async function getLearningPrograms(status?: LearningProgramStatus): Promise<LearningProgram[]> {
  const { data, error, response } = await apiClient.GET("/api/v1/teacher/programs", {
    params: {
      query: status ? { status } : {},
    },
  });

  if (error) {
    throw new ApiClientError(response.status, error);
  }

  return data;
}

export async function getLearningProgram(programId: string): Promise<LearningProgramDetails> {
  const { data, error, response } = await apiClient.GET("/api/v1/teacher/programs/{programId}", {
    params: {
      path: { programId },
    },
  });

  if (error) {
    throw new ApiClientError(response.status, error);
  }

  return data;
}

export async function getLearningProgramBySlug(slug: string): Promise<LearningProgramDetails> {
  const { data, error, response } = await apiClient.GET("/api/v1/teacher/programs/by-slug/{slug}", {
    params: {
      path: { slug },
    },
  });

  if (error) {
    throw new ApiClientError(response.status, error);
  }

  return data;
}

export const learningProgramQueries = {
  all: () => ["learning-programs"] as const,

  lists: () => [...learningProgramQueries.all(), "list"] as const,

  list: (status?: LearningProgramStatus) =>
    queryOptions({
      queryKey: [...learningProgramQueries.lists(), status ?? "ALL"] as const,
      queryFn: () => getLearningPrograms(status),
    }),

  bySlug: (slug: string) =>
    queryOptions({
      queryKey: [...learningProgramQueries.all(), "slug", slug] as const,
      queryFn: () => getLearningProgramBySlug(slug),
    }),

  detail: (programId: string) =>
    queryOptions({
      queryKey: [...learningProgramQueries.all(), "detail", programId] as const,
      queryFn: () => getLearningProgram(programId),
    }),
};
