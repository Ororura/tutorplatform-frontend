import type { ReportShareStatus } from "../api/report-share-queries";

export const reportShareStatusPresentation: Record<ReportShareStatus, { label: string; className: string }> = {
  ACTIVE: { label: "Активна", className: "bg-success-subtle text-success" },
  EXPIRED: { label: "Истекла", className: "bg-warning-subtle text-warning" },
  REVOKED: { label: "Отозвана", className: "bg-surface-subtle text-foreground-muted" },
};
