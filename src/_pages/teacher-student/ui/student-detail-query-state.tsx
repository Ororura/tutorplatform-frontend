import { Button } from "@/shared/ui/button";
import { ApiClientError } from "@/shared/api/client";

type Props = {
  isPending: boolean;
  isError: boolean;
  error?: Error | null;
  onRetry: () => void;
};

export function StudentDetailQueryState({ isPending, isError, error, onRetry }: Readonly<Props>) {
  if (isPending) {
    return <p aria-busy="true">Загружаем ученика…</p>;
  }

  if (isError) {
    if (error instanceof ApiClientError && error.status === 404) {
      return (
        <div className="rounded-lg border border-neutral-200 bg-white p-6" role="alert">
          <h1 className="text-2xl font-semibold">Ученик не найден</h1>
          <p className="mt-2 text-neutral-600">Проверьте ссылку или вернитесь к списку учеников.</p>
        </div>
      );
    }
    return (
      <div className="space-y-4" role="alert">
        <p>Не удалось загрузить карточку ученика.</p>
        <Button type="button" onClick={onRetry}>
          Повторить
        </Button>
      </div>
    );
  }

  return null;
}
