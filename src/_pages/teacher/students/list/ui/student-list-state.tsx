import { StudentList, type StudentPage } from "@/entities/student";
import { Button } from "@/shared/ui/button";

type Props = {
  isPending: boolean;
  isError: boolean;
  data?: StudentPage;
  onRetry: () => void;
  hasActiveFilters?: boolean;
  onAddStudent?: () => void;
};

export function StudentListState({
  isPending,
  isError,
  data,
  onRetry,
  hasActiveFilters,
  onAddStudent,
}: Readonly<Props>) {
  if (isPending) {
    return (
      <div className="rounded-2xl bg-slate-50 p-6 text-sm text-slate-500" aria-busy="true">
        Загружаем учеников…
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-3 rounded-2xl border border-red-100 bg-red-50 p-5" role="alert">
        <p className="text-sm text-red-700">Не удалось загрузить список учеников.</p>

        <Button type="button" variant="secondary" onClick={onRetry}>
          Повторить
        </Button>
      </div>
    );
  }

  if (data.items.length === 0) {
    return (
      <div className="rounded-xl bg-[var(--surface-muted)] px-4 py-6 text-center">
        <p className="font-semibold text-slate-900">
          {hasActiveFilters ? "Ученики не найдены" : "У вас пока нет учеников"}
        </p>

        <p className="mt-2 text-sm text-slate-500">
          {hasActiveFilters ? "Измените поиск или фильтры." : "Добавьте первого ученика, чтобы начать работу."}
        </p>

        {!hasActiveFilters && onAddStudent && (
          <Button className="mt-4" type="button" onClick={onAddStudent}>
            Добавить ученика
          </Button>
        )}
      </div>
    );
  }

  return <StudentList students={data.items} />;
}
