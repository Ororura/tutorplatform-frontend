import { StudentList, type StudentPage } from "@/entities/student";
import { Button } from "@/shared/ui/button";
import { EmptyState, ErrorState, LoadingState } from "@/shared/ui/feedback";

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
  if (isPending) return <LoadingState>Загружаем учеников…</LoadingState>;
  if (isError || !data) return <ErrorState title="Не удалось загрузить список учеников." onRetry={onRetry} />;
  if (!data.items.length)
    return (
      <EmptyState
        title={hasActiveFilters ? "Ученики не найдены" : "У вас пока нет учеников"}
        description={
          hasActiveFilters ? "Измените поиск или фильтры." : "Добавьте первого ученика, чтобы начать работу."
        }
        action={
          !hasActiveFilters && onAddStudent ? <Button onClick={onAddStudent}>Добавить ученика</Button> : undefined
        }
      />
    );
  return <StudentList students={data.items} />;
}
