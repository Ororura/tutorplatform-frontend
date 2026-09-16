import { queryOptions } from "@tanstack/react-query";

import { apiClient, ApiClientError } from "@/shared/api/client";
import type { components } from "@/shared/api/generated/schema";

export type StudentInvite = components["schemas"]["StudentInviteSummaryResponse"];
export type StudentInviteList = components["schemas"]["StudentInviteListResponse"];
export type PublicStudentInvite = components["schemas"]["PublicStudentInviteResponse"];

async function getStudentInvites(studentId: string): Promise<StudentInviteList> {
  const { data, error, response } = await apiClient.GET("/api/v1/teacher/students/{studentId}/invites", {
    params: { path: { studentId } },
  });

  if (error) {
    throw new ApiClientError(response.status, error);
  }

  return data;
}

async function getPublicStudentInvite(token: string): Promise<PublicStudentInvite> {
  const { data, error, response } = await apiClient.GET("/api/v1/public/student-invitations/{token}", {
    params: { path: { token } },
  });

  if (error) {
    throw new ApiClientError(response.status, error);
  }

  return data;
}

export const studentInviteQueries = {
  all: () => ["student-invites"] as const,
  lists: () => [...studentInviteQueries.all(), "list"] as const,
  list: (studentId: string) =>
    queryOptions({
      queryKey: [...studentInviteQueries.lists(), studentId] as const,
      queryFn: () => getStudentInvites(studentId),
    }),
  publicDetails: (token: string) =>
    queryOptions({
      queryKey: [...studentInviteQueries.all(), "public", token] as const,
      queryFn: () => getPublicStudentInvite(token),
      retry: false,
    }),
};
