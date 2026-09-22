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
    <section className="rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_12px_40px_rgba(45,79,135,0.06)] sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <Link2 size={18} />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Публичные ссылки на прогресс</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Создавайте временный или бессрочный доступ к текущему прогрессу выбранной программы.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <CreateProgressShareForm key={studentProgramId} studentId={studentId} studentProgramId={studentProgramId} />
      </div>

      <div className="mt-7 border-t border-slate-100 pt-6">
        <h3 className="font-semibold text-slate-950">Созданные ссылки</h3>

        {shares.isPending && (
          <p className="mt-4 rounded-2xl bg-slate-50 p-5 text-sm text-slate-500" aria-busy="true">
            Загружаем публичные ссылки…
          </p>
        )}

        {shares.isError && (
          <div className="mt-4 space-y-3 rounded-2xl border border-red-100 bg-red-50 p-5" role="alert">
            <p className="text-sm text-red-700">Не удалось загрузить публичные ссылки.</p>
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
