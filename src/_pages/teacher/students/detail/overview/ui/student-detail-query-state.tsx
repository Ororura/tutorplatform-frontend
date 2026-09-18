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
      <div
        className="rounded-[28px] border border-white/80 bg-white p-6 text-sm text-slate-500 shadow-[0_12px_40px_rgba(45,79,135,0.06)]"
        aria-busy="true"
      >
        Загружаем ученика…
      </div>
    );
  }

  if (isError) {
    if (error instanceof ApiClientError && error.status === 404) {
      return (
        <div
          className="rounded-[28px] border border-white/80 bg-white p-7 shadow-[0_12px_40px_rgba(45,79,135,0.06)]"
          role="alert"
        >
          <h1 className="text-2xl font-semibold text-slate-950">Ученик не найден</h1>

          <p className="mt-2 text-sm text-slate-500">Проверьте ссылку или вернитесь к списку учеников.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4 rounded-[28px] border border-red-100 bg-red-50 p-6" role="alert">
        <p className="text-sm text-red-700">Не удалось загрузить карточку ученика.</p>

        <Button type="button" variant="secondary" onClick={onRetry}>
          Повторить
        </Button>
      </div>
    );
  }

  return null;
}
