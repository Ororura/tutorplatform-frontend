import { ArrowRight, UserRound } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { getStudentAccountStatusLabel, getStudentStatusLabel, type StudentPage } from "@/entities/student";
import { Button } from "@/shared/ui/button";

type Props = {
  data?: StudentPage;
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
};

export function TeacherStudentsOverview({ data, isPending, isError, onRetry }: Readonly<Props>) {
  let content: ReactNode;

  if (isPending) {
    content = (
      <p aria-busy="true" className="py-4 text-sm text-[var(--text-secondary)]">
        Загружаем учеников…
      </p>
    );
  } else if (isError) {
    content = (
      <div role="alert" className="py-4">
        <p className="text-sm text-red-700">Не удалось загрузить учеников.</p>
        <Button className="mt-4" type="button" variant="secondary" onClick={onRetry}>
          Повторить
        </Button>
      </div>
    );
  } else if (!data || data.items.length === 0) {
    content = (
      <div className="py-4">
        <p className="font-medium text-slate-900">Учеников пока нет</p>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">Добавьте первого ученика через быстрые действия.</p>
      </div>
    );
  } else {
    content = (
      <>
        <ul className="mt-4 divide-y divide-slate-100">
          {data.items.map((student) => {
            const name = [student.firstName, student.lastName].filter(Boolean).join(" ");

            return (
              <li key={student.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                    <UserRound size={18} />
                  </span>

                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{name}</p>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                      {getStudentStatusLabel(student.status)} · {getStudentAccountStatusLabel(student.accountStatus)}
                    </p>
                  </div>
                </div>

                <Link
                  className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-blue-600 transition hover:text-blue-700 sm:self-auto"
                  href={`/teacher/students/${student.id}`}
                  aria-label={`Открыть ${name}`}
                >
                  Открыть
                  <ArrowRight size={15} />
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-3 flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
          {data.totalElements > data.items.length ? (
            <p className="text-xs text-[var(--text-secondary)]">
              Показаны последние {data.items.length} из {data.totalElements}
            </p>
          ) : (
            <span />
          )}

          <Link className="inline-flex items-center gap-2 text-sm font-medium text-blue-600" href="/teacher/students">
            Все ученики
            <ArrowRight size={15} />
          </Link>
        </div>
      </>
    );
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-white p-5 sm:p-6">
      <h2 className="text-xl font-semibold tracking-tight text-slate-950">Мои ученики</h2>

      {content}
    </section>
  );
}
