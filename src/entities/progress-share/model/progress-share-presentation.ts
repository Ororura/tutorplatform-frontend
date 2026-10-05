import type { ProgressShareStatus } from "../api/progress-share-queries";

export const progressShareStatusPresentation: Record<
  ProgressShareStatus,
  Readonly<{ label: ProgressShareStatus; className: string }>
> = {
  ACTIVE: { label: "ACTIVE", className: "bg-success-subtle text-success" },
  EXPIRED: { label: "EXPIRED", className: "bg-warning-subtle text-warning" },
  REVOKED: { label: "REVOKED", className: "bg-surface-subtle text-foreground-muted" },
};
