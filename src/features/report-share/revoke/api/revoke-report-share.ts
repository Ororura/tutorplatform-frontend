import { useMutation, useQueryClient } from "@tanstack/react-query";

import { reportShareQueries } from "@/entities/report-share";
import { apiClient, ApiClientError } from "@/shared/api/client";

async function revokeReportShare(reportId: string, shareId: string): Promise<void> {
  const { error, response } = await apiClient.DELETE("/api/v1/teacher/reports/{reportId}/shares/{shareId}", {
    params: { path: { reportId, shareId } },
  });

  if (error) throw new ApiClientError(response.status, error);
}

export function useRevokeReportShareMutation(reportId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (shareId: string) => revokeReportShare(reportId, shareId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: reportShareQueries.list(reportId).queryKey });
    },
  });
}
