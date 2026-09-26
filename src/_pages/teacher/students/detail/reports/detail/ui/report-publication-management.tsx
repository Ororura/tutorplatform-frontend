"use client";

import { useQuery } from "@tanstack/react-query";
import { Link2 } from "lucide-react";

import { ReportShareList, reportShareQueries } from "@/entities/report-share";
import { ReportPdfDownloadButton } from "@/features/report/download";
import { CreateReportShareForm } from "@/features/report-share/create";
import { RevokeReportShareButton } from "@/features/report-share/revoke";
import { Button } from "@/shared/ui/button";

export function ReportPublicationManagement({
  reportId,
  status,
}: Readonly<{ reportId: string; status: "DRAFT" | "PUBLISHED" | "ARCHIVED" }>) {
  const shares = useQuery(reportShareQueries.list(reportId));
  const published = status === "PUBLISHED";

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Link2 size={18} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Публикация для родителя</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              PDF и публичная ссылка содержат исторический snapshot отчёта на момент публикации.
            </p>
          </div>
        </div>
        {published && <ReportPdfDownloadButton audience="teacher" reportId={reportId} />}
      </div>

      <div className="mt-6">
        {published ? (
          <CreateReportShareForm reportId={reportId} />
        ) : (
          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
            {status === "DRAFT"
              ? "Сначала опубликуйте отчёт. Backend не создаёт публичные ссылки для черновиков."
              : "Для архивного отчёта нельзя создавать новые публичные ссылки."}
          </div>
        )}
      </div>

      <div className="mt-7 border-t border-slate-100 pt-6">
        <h3 className="font-semibold text-slate-950">История ссылок</h3>
        {shares.isPending && (
          <p className="mt-4 rounded-2xl bg-slate-50 p-5 text-sm text-slate-500" aria-busy="true">
            Загружаем историю ссылок…
          </p>
        )}
        {shares.isError && (
          <div className="mt-4 space-y-3 rounded-2xl border border-red-100 bg-red-50 p-5" role="alert">
            <p className="text-sm text-red-700">Не удалось загрузить историю ссылок.</p>
            <Button type="button" variant="secondary" onClick={() => void shares.refetch()}>
              Повторить
            </Button>
          </div>
        )}
        {shares.data && (
          <div className="mt-4">
            <ReportShareList
              shares={shares.data}
              renderActions={(share) =>
                share.status === "ACTIVE" ? <RevokeReportShareButton reportId={reportId} shareId={share.id} /> : null
              }
            />
          </div>
        )}
      </div>
    </section>
  );
}
