"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { learningProgramQueries } from "@/entities/learning-program";

import { duplicateLearningProgram } from "../api/duplicate-learning-program";

export function useDuplicateLearningProgramMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: duplicateLearningProgram,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: learningProgramQueries.lists() });
    },
  });
}
