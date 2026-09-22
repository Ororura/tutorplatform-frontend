import type { LucideIcon } from "lucide-react";

export function ProgressMetricCard({
  icon: Icon,
  label,
  value,
  hint,
}: Readonly<{
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
}>) {
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5">
      <span className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        <Icon size={18} aria-hidden="true" />
      </span>

      <p className="mt-4 text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-950">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </article>
  );
}
