import { useMutation, useQueryClient } from "@tanstack/react-query";

import { studentProgramQueries, type StudentProgramSummary } from "@/entities/student-program";
import { apiClient, ApiClientError } from "@/shared/api/client";
import type { components } from "@/shared/api/generated/schema";

export type AssignStudentProgramRequest = components["schemas"]["AssignStudentProgramRequest"];

type Variables = {
  studentId: string;
  body: AssignStudentProgramRequest;
};

async function assignStudentProgram({ studentId, body }: Variables): Promise<StudentProgramSummary> {
  const { data, error, response } = await apiClient.POST("/api/v1/teacher/students/{studentId}/programs", {
    params: { path: { studentId } },
    body,
  });

  if (error) {
    throw new ApiClientError(response.status, error);
  }

  return data;
}

export function useAssignStudentProgramMutation(studentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: AssignStudentProgramRequest) => assignStudentProgram({ studentId, body }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: studentProgramQueries.list(studentId).queryKey }),
        queryClient.invalidateQueries({ queryKey: studentProgramQueries.studentDetails(studentId) }),
      ]);
    },
  });
}
