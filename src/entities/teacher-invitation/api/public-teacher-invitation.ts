import { queryOptions } from "@tanstack/react-query";

import { apiClient, ApiClientError, type ApiErrorBody } from "@/shared/api/client";
import type { components } from "@/shared/api/generated/schema";

type RawPublicTeacherInvitation = components["schemas"]["PublicTeacherInvitationResponse"];

export type PublicTeacherInvitation = RawPublicTeacherInvitation & {
  email: string;
  status: "ACTIVE" | "ACCEPTED" | "REVOKED" | "EXPIRED";
  expiresAt: string;
};

async function getPublicTeacherInvitation(token: string): Promise<PublicTeacherInvitation> {
  const { data, error, response } = await apiClient.GET("/api/v1/public/teacher-invitations/{token}", {
    params: {
      path: { token },
    },
  });

  if (!response.ok) {
    throw new ApiClientError(
      response.status,
      (error ?? {
        code: "API_ERROR",
        message: "Не удалось получить приглашение",
        timestamp: new Date().toISOString(),
        traceId: "",
        details: [],
      }) as ApiErrorBody,
    );
  }

  if (!data?.email || !data.expiresAt || !["ACTIVE", "ACCEPTED", "REVOKED", "EXPIRED"].includes(data.status ?? "")) {
    throw new Error("Backend returned invalid teacher invitation");
  }

  return data as PublicTeacherInvitation;
}

export const publicTeacherInvitationQueries = {
  all: () => ["public-teacher-invitations"] as const,

  details: (token: string) =>
    queryOptions({
      queryKey: [...publicTeacherInvitationQueries.all(), token] as const,
      queryFn: () => getPublicTeacherInvitation(token),
      retry: false,
    }),
};
