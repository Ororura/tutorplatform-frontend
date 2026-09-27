import type { LearningProgram } from "@/entities/learning-program";
import { apiClient, ApiClientError } from "@/shared/api/client";

export async function duplicateLearningProgram(programId: string): Promise<LearningProgram> {
  const { data, error, response } = await apiClient.POST("/api/v1/teacher/programs/{programId}/duplicate", {
    params: { path: { programId } },
  });

  if (error) throw new ApiClientError(response.status, error);

  return data;
}
