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
    <article className="rounded-surface border border-border/80 bg-surface p-5">
      <span className="flex size-10 items-center justify-center rounded-surface bg-primary-subtle text-primary">
        <Icon size={18} aria-hidden="true" />
      </span>

      <p className="mt-4 text-sm text-foreground-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
      {hint && <p className="mt-1 text-xs text-foreground-subtle">{hint}</p>}
    </article>
  );
}
