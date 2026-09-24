import type { ReactNode } from "react";

import type { ReportShare } from "../api/report-share-queries";
import { reportShareStatusPresentation } from "../model/report-share-presentation";

const dateFormatter = new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short" });

export function ReportShareList({
  shares,
  renderActions,
}: Readonly<{
  shares: ReportShare[];
  renderActions?: (share: ReportShare) => ReactNode;
}>) {
  if (shares.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center">
        <p className="text-sm text-slate-500">Публичных ссылок для этого отчёта пока нет.</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-slate-100">
      {shares.map((share) => {
        const status = reportShareStatusPresentation[share.status];
        return (
          <li
            className="flex flex-col gap-4 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
            key={share.id}
          >
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}>
                  {status.label}
                </span>
                <span className="text-sm text-slate-500">
                  Создана {dateFormatter.format(new Date(share.createdAt))}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-500">
                {share.expiresAt
                  ? `Действует до ${dateFormatter.format(new Date(share.expiresAt))}`
                  : "Без даты истечения"}
              </p>
              {share.revokedAt && (
                <p className="mt-1 text-xs text-slate-400">
                  Отозвана {dateFormatter.format(new Date(share.revokedAt))}
                </p>
              )}
            </div>
            {renderActions?.(share)}
          </li>
        );
      })}
    </ul>
  );
}
