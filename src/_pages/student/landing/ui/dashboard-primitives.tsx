import { ArrowRight, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { ErrorState } from "@/shared/ui/feedback";

export function DashboardSection({
  title,
  subtitle,
  icon: Icon,
  href,
  linkLabel,
  children,
}: Readonly<{
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  href: string;
  linkLabel: string;
  children: ReactNode;
}>) {
  return (
    <section aria-label={title} className="min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-inset bg-surface-hover text-foreground-muted">
            <Icon size={19} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="section-title">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-foreground-muted">{subtitle}</p>}
          </div>
        </div>
        <Link
          className="group inline-flex items-center gap-2 rounded-surface px-2 py-2 text-sm font-medium text-primary transition hover:bg-primary-subtle hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          href={href}
        >
          {linkLabel}
          <ArrowRight size={16} className="transition group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
      </div>
      <div className="mt-5 space-y-3">{children}</div>
    </section>
  );
}

export { ProgressBar as DashboardProgress } from "@/shared/ui/progress-bar";

export function DashboardSkeleton({ label }: Readonly<{ label: string }>) {
  return (
    <div role="status" aria-busy="true" className="space-y-3">
      <span className="sr-only">{label}</span>
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="space-y-4 rounded-surface border border-border p-5 motion-safe:animate-pulse"
          aria-hidden="true"
        >
          <div className="h-5 w-2/3 rounded bg-surface-subtle" />
          <div className="h-3 w-1/2 rounded bg-surface-subtle" />
          <div className="h-9 rounded-surface bg-surface-subtle" />
        </div>
      ))}
    </div>
  );
}

export function DashboardError({ message, retry }: Readonly<{ message: string; retry: () => void }>) {
  return <ErrorState title={message} onRetry={retry} />;
}
