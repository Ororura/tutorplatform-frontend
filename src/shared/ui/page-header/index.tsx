import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  className,
}: Readonly<{
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  className?: string;
}>) {
  return (
    <header
      className={cn(
        "flex w-full min-w-0 flex-col items-start justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-start",
        className,
      )}
    >
      <div className="w-full min-w-0 sm:flex-1">
        {eyebrow && (
          <p className="mb-2 wrap-anywhere text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {eyebrow}
          </p>
        )}
        <h1 className="page-title">{title}</h1>
        {description && <p className="page-description mt-2">{description}</p>}
      </div>
      {actions && <div className="flex max-w-full shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
