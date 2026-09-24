import type { ReportShareStatus } from "../api/report-share-queries";

export const reportShareStatusPresentation: Record<ReportShareStatus, { label: string; className: string }> = {
  ACTIVE: { label: "Активна", className: "bg-emerald-50 text-emerald-700" },
  EXPIRED: { label: "Истекла", className: "bg-amber-50 text-amber-700" },
  REVOKED: { label: "Отозвана", className: "bg-slate-100 text-slate-600" },
};
