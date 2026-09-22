import type { ProgressShareStatus } from "../api/progress-share-queries";

export const progressShareStatusPresentation: Record<
  ProgressShareStatus,
  Readonly<{ label: ProgressShareStatus; className: string }>
> = {
  ACTIVE: { label: "ACTIVE", className: "bg-emerald-50 text-emerald-700" },
  EXPIRED: { label: "EXPIRED", className: "bg-amber-50 text-amber-700" },
  REVOKED: { label: "REVOKED", className: "bg-slate-100 text-slate-600" },
};
