import { queryOptions } from "@tanstack/react-query";

import { apiClient, ApiClientError, type ApiErrorBody } from "@/shared/api/client";
import type { components } from "@/shared/api/generated/schema";

type RawPlatformSettings = components["schemas"]["PlatformSettingsResponse"];

export type RegistrationMode = NonNullable<RawPlatformSettings["registrationMode"]>;

export type PlatformSettings = RawPlatformSettings & {
  registrationMode: RegistrationMode;
};

export function requirePlatformSettings(data: RawPlatformSettings | undefined): PlatformSettings {
  if (!data || (data.registrationMode !== "OPEN" && data.registrationMode !== "INVITE_ONLY")) {
    throw new Error("Backend returned invalid platform settings");
  }

  return {
    ...data,
    registrationMode: data.registrationMode,
  };
}

async function getPlatformSettings(): Promise<PlatformSettings> {
  const { data, error, response } = await apiClient.GET("/api/v1/admin/settings");

  if (!response.ok) {
    throw new ApiClientError(
      response.status,
      (error ?? {
        code: "API_ERROR",
        message: "Не удалось загрузить настройки платформы",
        timestamp: new Date().toISOString(),
        traceId: "",
        details: [],
      }) as ApiErrorBody,
    );
  }

  return requirePlatformSettings(data);
}

export const platformSettingsQueries = {
  all: () => ["platform-settings"] as const,

  admin: () =>
    queryOptions({
      queryKey: [...platformSettingsQueries.all(), "admin"] as const,
      queryFn: getPlatformSettings,
      staleTime: 0,
    }),
};
