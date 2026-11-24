import type { ReactNode, Ref } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/shared/lib/cn";

export function PageBackLink({ href, children }: Readonly<{ href: string; children: ReactNode }>) {
  return (
    <Link
      href={href}
      className="inline-flex w-fit max-w-full items-center gap-2 rounded-control text-sm font-medium text-muted-foreground hover:text-primary"
    >
      <ArrowLeft size={16} className="shrink-0" aria-hidden="true" />
      <span className="wrap-anywhere">{children}</span>
    </Link>
  );
}

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  navigation,
  details,
  headingRef,
  className,
}: Readonly<{
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  navigation?: ReactNode;
  details?: ReactNode;
  headingRef?: Ref<HTMLHeadingElement>;
  className?: string;
}>) {
  return (
    <header className={cn("w-full min-w-0 space-y-4 border-b border-border pb-6", className)}>
      {navigation && <div className="min-w-0">{navigation}</div>}
      <div className="flex min-w-0 flex-col items-start justify-between gap-4 md:flex-row">
        <div className="w-full min-w-0 md:flex-1">
          {eyebrow && <p className="mb-2 wrap-anywhere text-xs font-medium text-muted-foreground">{eyebrow}</p>}
          <h1 className="page-title" ref={headingRef} tabIndex={headingRef ? -1 : undefined}>
            {title}
          </h1>
          {description && <p className="page-description mt-2">{description}</p>}
          {details && <div className="mt-3 min-w-0 wrap-anywhere">{details}</div>}
        </div>
        {actions && (
          <div className="flex max-w-full flex-wrap items-center gap-2 md:max-w-1/2 *:max-w-full">{actions}</div>
        )}
      </div>
    </header>
  );
}
