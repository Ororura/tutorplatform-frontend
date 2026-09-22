"use client";

import { ApiClientError } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";

import { useRevokeProgressShareMutation } from "../api/revoke-progress-share";

export function RevokeProgressShareButton({
  studentId,
  studentProgramId,
  shareId,
}: Readonly<{ studentId: string; studentProgramId: string; shareId: string }>) {
  const mutation = useRevokeProgressShareMutation(studentId, studentProgramId);

  async function handleRevoke() {
    if (!window.confirm("Отозвать публичную ссылку? Доступ к прогрессу по ней будет закрыт.")) return;

    try {
      await mutation.mutateAsync(shareId);
    } catch {
      // Ошибка отображается из состояния мутации ниже.
    }
  }

  return (
    <div className="space-y-2 sm:text-right">
      <Button type="button" variant="danger" disabled={mutation.isPending} onClick={() => void handleRevoke()}>
        {mutation.isPending ? "Отзываем…" : "Отозвать"}
      </Button>
      {mutation.isError && (
        <p className="max-w-xs text-sm text-red-700" role="alert">
          {mutation.error instanceof ApiClientError
            ? mutation.error.body.message
            : "Не удалось отозвать публичную ссылку."}
        </p>
      )}
    </div>
  );
}
