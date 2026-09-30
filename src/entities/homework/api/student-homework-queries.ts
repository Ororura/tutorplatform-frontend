import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";

import { apiClient, ApiClientError } from "@/shared/api/client";
import type { components, operations } from "@/shared/api/generated/schema";

export type StudentHomeworkSummary = components["schemas"]["StudentHomeworkSummaryResponse"];
export type StudentHomeworkDetails = components["schemas"]["StudentHomeworkDetailsResponse"];
export type StudentHomeworkItem = components["schemas"]["StudentHomeworkItemResponse"];
export type StudentHomeworkPage = components["schemas"]["StudentHomeworkPageResponse"];
export type StudentHomeworkListParams = NonNullable<operations["listStudentHomeworks"]["parameters"]["query"]>;

export async function getCurrentStudentHomeworks(params: StudentHomeworkListParams): Promise<StudentHomeworkPage> {
  const { data, error, response } = await apiClient.GET("/api/v1/student/homeworks", {
    params: { query: params },
  });
  if (error) throw new ApiClientError(response.status, error);
  return data;
}

export async function getCurrentStudentHomework(homeworkId: string): Promise<StudentHomeworkDetails> {
  const { data, error, response } = await apiClient.GET("/api/v1/student/homeworks/{homeworkId}", {
    params: { path: { homeworkId } },
  });
  if (error) throw new ApiClientError(response.status, error);
  return data;
}

export const studentHomeworkQueries = {
  all: () => ["student-homework"] as const,
  lists: () => [...studentHomeworkQueries.all(), "list"] as const,
  list: (params: StudentHomeworkListParams) =>
    queryOptions({
      queryKey: [...studentHomeworkQueries.lists(), params] as const,
      queryFn: () => getCurrentStudentHomeworks(params),
    }),
  infiniteList: (params: Omit<StudentHomeworkListParams, "page">) =>
    infiniteQueryOptions({
      queryKey: [...studentHomeworkQueries.lists(), "infinite", params] as const,
      initialPageParam: 0,
      queryFn: ({ pageParam }) => getCurrentStudentHomeworks({ ...params, page: pageParam }),
      getNextPageParam: (lastPage) => (lastPage.page + 1 < lastPage.totalPages ? lastPage.page + 1 : undefined),
    }),
  details: () => [...studentHomeworkQueries.all(), "detail"] as const,
  detail: (homeworkId: string) =>
    queryOptions({
      queryKey: [...studentHomeworkQueries.details(), homeworkId] as const,
      queryFn: () => getCurrentStudentHomework(homeworkId),
    }),
};
