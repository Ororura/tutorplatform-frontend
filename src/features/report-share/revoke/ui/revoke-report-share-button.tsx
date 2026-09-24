"use client";

import { Button } from "@/shared/ui/button";

import { useRevokeReportShareMutation } from "../api/revoke-report-share";

export function RevokeReportShareButton({ reportId, shareId }: Readonly<{ reportId: string; shareId: string }>) {
  const mutation = useRevokeReportShareMutation(reportId);

  async function revoke() {
    if (!window.confirm("Отозвать публичную ссылку? Родитель больше не сможет открыть отчёт.")) return;
    try {
      await mutation.mutateAsync(shareId);
    } catch {
      // Состояние ошибки показывается рядом с действием.
    }
  }

  return (
    <div className="space-y-2 sm:text-right">
      <Button type="button" variant="danger" disabled={mutation.isPending} onClick={() => void revoke()}>
        {mutation.isPending ? "Отзываем…" : "Отозвать доступ"}
      </Button>
      {mutation.isError && (
        <p className="max-w-xs text-sm text-red-700" role="alert">
          Не удалось отозвать ссылку. Попробуйте ещё раз.
        </p>
      )}
    </div>
  );
}
