import { ArrowRight, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/shared/ui/button";

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
    <section
      aria-label={title}
      className="min-w-0 rounded-2xl border border-[var(--border)] bg-white p-4 shadow-xs sm:p-5 xl:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Icon size={24} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-tight text-slate-950 2xl:text-2xl">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
          </div>
        </div>
        <Link
          className="group inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
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
          className="space-y-4 rounded-2xl border border-slate-100 p-5 motion-safe:animate-pulse"
          aria-hidden="true"
        >
          <div className="h-5 w-2/3 rounded bg-slate-100" />
          <div className="h-3 w-1/2 rounded bg-slate-100" />
          <div className="h-9 rounded-xl bg-slate-50" />
        </div>
      ))}
    </div>
  );
}

export function DashboardError({ message, retry }: Readonly<{ message: string; retry: () => void }>) {
  return (
    <div role="alert" className="space-y-3 rounded-xl border border-red-100 p-4">
      <p className="text-sm text-red-700">{message}</p>
      <Button variant="secondary" onClick={retry}>
        Повторить
      </Button>
    </div>
  );
}
