import { queryOptions } from "@tanstack/react-query";

import { apiClient, ApiClientError, type ApiErrorBody } from "@/shared/api/client";
import type { components } from "@/shared/api/generated/schema";

type RawInvitation = components["schemas"]["TeacherInvitationSummaryResponse"];

type RawCreatedInvitation = components["schemas"]["TeacherInvitationCreatedResponse"];

export type TeacherInvitationStatus = NonNullable<RawInvitation["status"]>;

export type TeacherInvitation = RawInvitation & {
  id: string;
  email: string;
  status: TeacherInvitationStatus;
};

export type CreatedTeacherInvitation = RawCreatedInvitation & {
  id: string;
  email: string;
  invitationUrl: string;
};

export function requireCreatedTeacherInvitation(data: RawCreatedInvitation | undefined): CreatedTeacherInvitation {
  if (!data?.id || !data.email || !data.invitationUrl) {
    throw new Error("Backend returned invalid teacher invitation");
  }

  return {
    ...data,
    id: data.id,
    email: data.email,
    invitationUrl: data.invitationUrl,
  };
}

async function getTeacherInvitations(): Promise<TeacherInvitation[]> {
  const { data, error, response } = await apiClient.GET("/api/v1/admin/teacher-invitations");

  if (!response.ok) {
    throw new ApiClientError(
      response.status,
      (error ?? {
        code: "API_ERROR",
        message: "Не удалось загрузить приглашения",
        timestamp: new Date().toISOString(),
        traceId: "",
        details: [],
      }) as ApiErrorBody,
    );
  }

  const invitations = data?.invitations;

  if (!Array.isArray(invitations)) {
    throw new Error("Backend returned invalid invitation list");
  }

  return invitations.map((invitation) => {
    if (!invitation.id || !invitation.email || !invitation.status) {
      throw new Error("Backend returned invalid invitation");
    }

    return {
      ...invitation,
      id: invitation.id,
      email: invitation.email,
      status: invitation.status,
    };
  });
}

export const teacherInvitationQueries = {
  all: () => ["teacher-invitations"] as const,

  list: () =>
    queryOptions({
      queryKey: [...teacherInvitationQueries.all(), "list"] as const,
      queryFn: getTeacherInvitations,
      staleTime: 0,
    }),
};
