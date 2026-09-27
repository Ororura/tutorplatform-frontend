"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { studentProgramQueries } from "@/entities/student-program";

import { updateStudentTopicAccess, type StudentTopicAccessStatus } from "../api/update-student-topic-access";

export type StudentTopicAccessMutationVariables = {
  status: StudentTopicAccessStatus;
  topicIds: string[];
};

export function useStudentTopicAccessMutation(studentId: string, studentProgramId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ status, topicIds }: StudentTopicAccessMutationVariables) =>
      updateStudentTopicAccess({
        studentId,
        studentProgramId,
        status,
        topicIds,
      }),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: studentProgramQueries.detail(studentId, studentProgramId).queryKey,
      });
    },
  });
}
