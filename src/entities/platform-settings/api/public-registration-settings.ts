import { queryOptions } from "@tanstack/react-query";

import { apiClient, ApiClientError, type ApiErrorBody } from "@/shared/api/client";

import type { RegistrationMode } from "./platform-settings-queries";

export type PublicRegistrationSettings = {
  registrationMode: RegistrationMode;
};

export async function getPublicRegistrationSettings(): Promise<PublicRegistrationSettings> {
  const { data, error, response } = await apiClient.GET("/api/v1/public/registration-settings");

  if (!response.ok) {
    throw new ApiClientError(
      response.status,
      (error ?? {
        code: "API_ERROR",
        message: "Не удалось получить настройки регистрации",
        timestamp: new Date().toISOString(),
        traceId: "",
        details: [],
      }) as ApiErrorBody,
    );
  }

  if (!data || (data.registrationMode !== "OPEN" && data.registrationMode !== "INVITE_ONLY")) {
    throw new Error("Backend returned invalid registration settings");
  }

  return {
    registrationMode: data.registrationMode,
  };
}

export const publicRegistrationSettingsQueries = {
  all: () => ["public-registration-settings"] as const,

  current: () =>
    queryOptions({
      queryKey: [...publicRegistrationSettingsQueries.all(), "current"] as const,
      queryFn: getPublicRegistrationSettings,

      staleTime: 0,
      retry: false,
      refetchOnMount: "always",
      refetchOnWindowFocus: true,
    }),
};
