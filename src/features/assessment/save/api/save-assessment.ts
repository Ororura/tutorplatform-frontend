import { useMutation, useQueryClient } from "@tanstack/react-query";

import { assessmentQueries, type TeacherAssessment } from "@/entities/assessment";
import { apiClient, ApiClientError } from "@/shared/api/client";
import type { components } from "@/shared/api/generated/schema";

export type SaveTeacherAssessmentRequest = components["schemas"]["SaveTeacherAssessmentRequest"];

async function saveTeacherAssessment(
  studentId: string,
  sessionId: string,
  body: SaveTeacherAssessmentRequest,
): Promise<TeacherAssessment> {
  const { data, error, response } = await apiClient.PUT(
    "/api/v1/teacher/students/{studentId}/sessions/{sessionId}/assessment",
    { params: { path: { studentId, sessionId } }, body },
  );
  if (error) throw new ApiClientError(response.status, error);
  return data;
}

export function useSaveAssessmentMutation(studentId: string, sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: SaveTeacherAssessmentRequest) => saveTeacherAssessment(studentId, sessionId, body),
    onSuccess: (saved) => {
      queryClient.setQueryData(assessmentQueries.detail(studentId, sessionId).queryKey, saved);
    },
  });
}
