import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { StudentList, type StudentPage } from "@/entities/student";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { EmptyState, LoadingState, ErrorState } from "@/shared/ui/feedback";

type Props = { data?: StudentPage; isPending: boolean; isError: boolean; onRetry: () => void };
export function TeacherStudentsOverview({ data, isPending, isError, onRetry }: Readonly<Props>) {
  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <CardTitle>Мои ученики</CardTitle>
        <Link
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          href="/teacher/students"
        >
          Все ученики
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        {isPending ? (
          <LoadingState>Загружаем учеников…</LoadingState>
        ) : isError ? (
          <ErrorState title="Не удалось загрузить учеников." onRetry={onRetry} />
        ) : !data?.items.length ? (
          <EmptyState title="Учеников пока нет" description="Добавьте первого ученика через быстрые действия." />
        ) : (
          <StudentList students={data.items} />
        )}
        {data && data.totalElements > data.items.length && (
          <p className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
            Показаны последние {data.items.length} из {data.totalElements}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
