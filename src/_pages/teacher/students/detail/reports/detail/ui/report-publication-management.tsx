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
    <section className="surface">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-surface bg-primary-subtle text-primary">
            <Link2 size={18} aria-hidden="true" />
          </span>
          <div>
            <h2 className="section-title">Публикация для родителя</h2>
            <p className="mt-1 text-sm leading-6 text-foreground-muted">
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
          <div className="rounded-surface border border-warning-border bg-warning-subtle p-4 text-sm text-warning">
            {status === "DRAFT"
              ? "Сначала опубликуйте отчёт. Backend не создаёт публичные ссылки для черновиков."
              : "Для архивного отчёта нельзя создавать новые публичные ссылки."}
          </div>
        )}
      </div>

      <div className="mt-7 border-t border-border pt-6">
        <h3 className="font-semibold text-foreground">История ссылок</h3>
        {shares.isPending && (
          <p className="mt-4 rounded-surface bg-surface-subtle p-5 text-sm text-foreground-muted" aria-busy="true">
            Загружаем историю ссылок…
          </p>
        )}
        {shares.isError && (
          <div className="mt-4 space-y-3 rounded-surface border border-danger-border bg-danger-subtle p-5" role="alert">
            <p className="text-sm text-danger">Не удалось загрузить историю ссылок.</p>
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
