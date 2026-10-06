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
    <header className={cn("flex flex-col items-start justify-between gap-4 sm:flex-row", className)}>
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-sm text-foreground-muted">{eyebrow}</p>}
        <h1 className="page-title">{title}</h1>
        {description && <p className="page-description mt-2">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
