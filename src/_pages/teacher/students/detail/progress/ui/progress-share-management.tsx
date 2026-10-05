"use client";

import { useQuery } from "@tanstack/react-query";
import { Link2 } from "lucide-react";

import { ProgressShareList, progressShareQueries } from "@/entities/progress-share";
import { CreateProgressShareForm } from "@/features/progress-share/create";
import { RevokeProgressShareButton } from "@/features/progress-share/revoke";
import { Button } from "@/shared/ui/button";

export function ProgressShareManagement({
  studentId,
  studentProgramId,
}: Readonly<{ studentId: string; studentProgramId: string }>) {
  const shares = useQuery(progressShareQueries.list(studentId, studentProgramId));

  return (
    <section className="surface">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-surface bg-primary-subtle text-primary">
          <Link2 size={18} />
        </span>
        <div>
          <h2 className="section-title">Публичные ссылки на прогресс</h2>
          <p className="mt-1 text-sm leading-6 text-foreground-muted">
            Создавайте временный или бессрочный доступ к текущему прогрессу выбранной программы.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <CreateProgressShareForm key={studentProgramId} studentId={studentId} studentProgramId={studentProgramId} />
      </div>

      <div className="mt-7 border-t border-border pt-6">
        <h3 className="font-semibold text-foreground">Созданные ссылки</h3>

        {shares.isPending && (
          <p className="mt-4 rounded-surface bg-surface-subtle p-5 text-sm text-foreground-muted" aria-busy="true">
            Загружаем публичные ссылки…
          </p>
        )}

        {shares.isError && (
          <div className="mt-4 space-y-3 rounded-surface border border-danger-border bg-danger-subtle p-5" role="alert">
            <p className="text-sm text-danger">Не удалось загрузить публичные ссылки.</p>
            <Button type="button" variant="secondary" onClick={() => void shares.refetch()}>
              Повторить
            </Button>
          </div>
        )}

        {shares.data && (
          <div className="mt-4">
            <ProgressShareList
              shares={shares.data}
              renderActions={(share) =>
                share.status === "ACTIVE" ? (
                  <RevokeProgressShareButton
                    studentId={studentId}
                    studentProgramId={studentProgramId}
                    shareId={share.id}
                  />
                ) : null
              }
            />
          </div>
        )}
      </div>
    </section>
  );
}
