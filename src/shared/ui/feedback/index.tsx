import type { ReactNode } from "react";
import { CircleAlert, Inbox } from "lucide-react";
import { Skeleton } from "@/shared/ui/skeleton";
import { Button } from "@/shared/ui/button";

export function EmptyState({
  title,
  description,
  action,
}: Readonly<{ title: string; description?: string; action?: ReactNode }>) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-card px-6 py-10 text-center">
      <Inbox size={20} className="mb-4 shrink-0 text-muted-foreground" aria-hidden="true" />
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
    <div
      role="status"
      aria-busy="true"
      className="space-y-4 rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground"
    >
      {children}
      <div className="space-y-3" aria-hidden="true">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
      </div>
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
