"use client";

import { useQuery } from "@tanstack/react-query";
import { ClipboardCheck } from "lucide-react";

import { getStudentHomeworkPresentationState, StudentHomeworkList, studentHomeworkQueries } from "@/entities/homework";
import { Button } from "@/shared/ui/button";

export function StudentHomeworksView() {
  const homeworks = useQuery(
    studentHomeworkQueries.list({
      page: 0,
      size: 20,
      sort: "assignedAt,desc",
    }),
  );

  const items = homeworks.data?.items ?? [];

  const pendingCount = items.filter((homework) => {
    const state = getStudentHomeworkPresentationState(homework);

    return state === "ASSIGNED" || state === "OVERDUE";
  }).length;

  const completedCount = items.filter(
    (homework) => getStudentHomeworkPresentationState(homework) === "COMPLETED",
  ).length;

  return (
    <main className="space-y-6">
      <section className="py-2">
        <div className="flex items-center gap-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[var(--text-secondary)]">
            <ClipboardCheck size={22} />
          </span>

          <div>
            <p className="text-sm font-medium text-[var(--text-secondary)]">Учебный кабинет</p>

            <h1 className="mt-1 break-words text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              Домашние задания
            </h1>

            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              Здесь находятся задания преподавателя и результаты их проверки.
            </p>
          </div>
        </div>
      </section>

      <div className="space-y-5">
        <section className="min-w-0">
          <div>
            <h2 className="text-base font-semibold text-slate-950">Ваши задания</h2>

            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Последние назначенные задания отображаются первыми.
            </p>
          </div>

          <div className="mt-5">
            {homeworks.isPending && (
              <div className="rounded-2xl bg-slate-50 p-5 text-sm text-[var(--text-secondary)]" aria-busy="true">
                Загружаем домашние задания…
              </div>
            )}

            {homeworks.isError && (
              <div className="space-y-3 rounded-2xl border border-red-100 bg-red-50 p-5" role="alert">
                <p className="text-sm text-red-700">Не удалось загрузить домашние задания.</p>

                <Button variant="secondary" type="button" onClick={() => homeworks.refetch()}>
                  Повторить
                </Button>
              </div>
            )}

            {homeworks.data?.items.length === 0 && (
              <div className="rounded-xl bg-[var(--surface-muted)] px-4 py-6 text-center">
                <ClipboardCheck size={30} className="mx-auto text-blue-500" />

                <p className="mt-4 font-semibold text-slate-950">Домашних заданий пока нет</p>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--text-secondary)]">
                  Когда преподаватель назначит новую работу, она появится здесь.
                </p>
              </div>
            )}

            {homeworks.data && homeworks.data.items.length > 0 && (
              <StudentHomeworkList homeworks={homeworks.data.items} />
            )}
          </div>
        </section>

        <aside className="min-w-0">
          <section className="border-t border-[var(--border)] pt-4">
            <ClipboardCheck size={21} className="text-blue-600" />

            <h2 className="mt-4 font-semibold text-slate-950">Ваша нагрузка</h2>

            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              Краткая информация по домашним заданиям.
            </p>

            <div className="mt-3 grid gap-x-6 sm:grid-cols-3">
              <div className="flex items-end justify-between py-2">
                <span className="text-sm text-[var(--text-secondary)]">Всего</span>

                <span className="text-2xl font-semibold text-slate-950">{homeworks.data?.totalElements ?? "—"}</span>
              </div>

              <div className="flex items-end justify-between py-2">
                <span className="text-sm text-[var(--text-secondary)]">К выполнению</span>

                <span className="text-2xl font-semibold text-blue-700">{homeworks.data ? pendingCount : "—"}</span>
              </div>

              <div className="flex items-end justify-between py-2">
                <span className="text-sm text-[var(--text-secondary)]">Выполнено</span>

                <span className="text-2xl font-semibold text-emerald-700">{homeworks.data ? completedCount : "—"}</span>
              </div>
            </div>

            <p className="mt-3 text-xs leading-5 text-[var(--text-secondary)]">
              Счётчики выполнения относятся к текущей загруженной странице.
            </p>
          </section>
        </aside>
      </div>
    </main>
  );
}
