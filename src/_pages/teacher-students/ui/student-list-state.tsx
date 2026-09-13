import { StudentList, type StudentPage } from "@/entities/student";
import { Button } from "@/shared/ui/button";

type Props = {
  isPending: boolean;
  isError: boolean;
  data?: StudentPage;
  onRetry: () => void;
};

export function StudentListState({ isPending, isError, data, onRetry }: Readonly<Props>) {
  if (isPending) {
    return <p className="rounded-lg border border-neutral-200 bg-white p-5 text-neutral-600" aria-busy="true">Загружаем учеников…</p>;
  }

  if (isError || !data) {
    return (
      <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-5" role="alert">
        <p className="text-red-800">Не удалось загрузить список учеников.</p>
        <Button type="button" onClick={onRetry}>Повторить</Button>
      </div>
    );
  }

  if (data.items.length === 0) {
    return <p className="rounded-lg border border-dashed border-neutral-300 p-8 text-center text-neutral-600">Ученики не найдены.</p>;
  }

  return <StudentList students={data.items} />;
}
