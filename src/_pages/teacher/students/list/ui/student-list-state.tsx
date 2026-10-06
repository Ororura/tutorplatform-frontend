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
      <div className="rounded-surface bg-surface-subtle p-6 text-sm text-foreground-muted" aria-busy="true">
        Загружаем учеников…
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-3 rounded-surface border border-danger-border bg-danger-subtle p-5" role="alert">
        <p className="text-sm text-danger">Не удалось загрузить список учеников.</p>

        <Button type="button" variant="secondary" onClick={onRetry}>
          Повторить
        </Button>
      </div>
    );
  }

  if (data.items.length === 0) {
    return (
      <div className="rounded-surface bg-(--surface-muted) px-4 py-6 text-center">
        <p className="font-semibold text-foreground">
          {hasActiveFilters ? "Ученики не найдены" : "У вас пока нет учеников"}
        </p>

        <p className="mt-2 text-sm text-foreground-muted">
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
