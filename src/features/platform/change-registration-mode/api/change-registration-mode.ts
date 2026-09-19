import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  platformSettingsQueries,
  requirePlatformSettings,
  type PlatformSettings,
  type RegistrationMode,
} from "@/entities/platform-settings";
import { apiClient, ApiClientError, type ApiErrorBody } from "@/shared/api/client";

async function changeRegistrationMode(mode: RegistrationMode): Promise<PlatformSettings> {
  const { data, error, response } = await apiClient.PATCH("/api/v1/admin/settings/registration", {
    body: { mode },
  });

  if (!response.ok) {
    throw new ApiClientError(
      response.status,
      (error ?? {
        code: "API_ERROR",
        message: "Не удалось изменить режим регистрации",
        timestamp: new Date().toISOString(),
        traceId: "",
        details: [],
      }) as ApiErrorBody,
    );
  }

  return requirePlatformSettings(data);
}

export function useChangeRegistrationModeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: changeRegistrationMode,

    onSuccess: async (settings) => {
      queryClient.setQueryData(platformSettingsQueries.admin().queryKey, settings);

      await queryClient.invalidateQueries({
        queryKey: platformSettingsQueries.all(),
      });

      await queryClient.invalidateQueries({
        queryKey: ["public-registration-settings"],
      });
    },
  });
}
