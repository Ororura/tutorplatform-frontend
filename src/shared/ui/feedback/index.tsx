import type { ReactNode } from "react";
import { CircleAlert, Inbox, LoaderCircle } from "lucide-react";
import { Button } from "@/shared/ui/button";

export function EmptyState({
  title,
  description,
  action,
}: Readonly<{ title: string; description?: string; action?: ReactNode }>) {
  return (
    <div className="feedback flex items-start gap-3">
      <Inbox size={20} className="mt-0.5 shrink-0 text-foreground-subtle" aria-hidden="true" />
      <div className="min-w-0">
        <p className="card-title">{title}</p>
        {description && <p className="mt-1 text-foreground-muted">{description}</p>}
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  );
}
export function LoadingState({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div role="status" aria-busy="true" className="feedback flex items-center gap-3 text-foreground-muted">
      <LoaderCircle size={18} className="shrink-0 motion-safe:animate-spin" aria-hidden="true" />
      {children}
    </div>
  );
}
export function ErrorState({
  title,
  description = "Проверьте соединение и попробуйте ещё раз.",
  onRetry,
  retryLabel = "Повторить",
}: Readonly<{ title: string; description?: string; onRetry?: () => void; retryLabel?: string }>) {
  return (
    <div role="alert" className="feedback flex items-start gap-3 border border-danger-border bg-danger-subtle">
      <CircleAlert size={20} className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />
      <div className="min-w-0">
        <p className="card-title">{title}</p>
        <p className="mt-1 text-foreground-muted">{description}</p>
        {onRetry && (
          <Button type="button" variant="secondary" className="mt-3" onClick={onRetry}>
            {retryLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
