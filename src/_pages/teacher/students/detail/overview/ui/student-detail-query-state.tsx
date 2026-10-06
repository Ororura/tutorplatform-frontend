import { ApiClientError } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";

type Props = {
  isPending: boolean;
  isError: boolean;
  error?: Error | null;
  onRetry: () => void;
};

export function StudentDetailQueryState({ isPending, isError, error, onRetry }: Readonly<Props>) {
  if (isPending) {
    return (
      <div className="surface text-sm text-foreground-muted" aria-busy="true">
        Загружаем ученика…
      </div>
    );
  }

  if (isError) {
    if (error instanceof ApiClientError && error.status === 404) {
      return (
        <div className="rounded-surface border border-(--border) bg-surface p-7" role="alert">
          <h1 className="page-title">Ученик не найден</h1>

          <p className="mt-2 text-sm text-foreground-muted">Проверьте ссылку или вернитесь к списку учеников.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4 rounded-surface border border-danger-border bg-danger-subtle p-6" role="alert">
        <p className="text-sm text-danger">Не удалось загрузить карточку ученика.</p>

        <Button type="button" variant="secondary" onClick={onRetry}>
          Повторить
        </Button>
      </div>
    );
  }

  return null;
}
