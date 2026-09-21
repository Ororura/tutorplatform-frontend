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
    <main className="space-y-4">
      <section className="rounded-[28px] border border-white/80 bg-white p-6 shadow-[0_12px_40px_rgba(45,79,135,0.06)] sm:p-7">
        <div className="flex items-center gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <ClipboardCheck size={22} />
          </span>

          <div>
            <p className="text-sm font-medium text-blue-600">Учебный кабинет</p>

            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">Домашние задания</h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Здесь находятся задания преподавателя и результаты их проверки.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-w-0 rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_12px_40px_rgba(45,79,135,0.06)] sm:p-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Ваши задания</h2>

            <p className="mt-1 text-sm text-slate-500">Последние назначенные задания отображаются первыми.</p>
          </div>

          <div className="mt-5">
            {homeworks.isPending && (
              <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500" aria-busy="true">
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
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-10 text-center">
                <ClipboardCheck size={30} className="mx-auto text-blue-500" />

                <p className="mt-4 font-semibold text-slate-950">Домашних заданий пока нет</p>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Когда преподаватель назначит новую работу, она появится здесь.
                </p>
              </div>
            )}

            {homeworks.data && homeworks.data.items.length > 0 && (
              <StudentHomeworkList homeworks={homeworks.data.items} />
            )}
          </div>
        </section>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <section className="rounded-[28px] border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
            <ClipboardCheck size={21} className="text-blue-600" />

            <h2 className="mt-4 font-semibold text-slate-950">Ваша нагрузка</h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">Краткая информация по домашним заданиям.</p>

            <div className="mt-5 space-y-3">
              <div className="flex items-end justify-between rounded-2xl bg-white/80 p-4">
                <span className="text-sm text-slate-500">Всего</span>

                <span className="text-2xl font-semibold text-slate-950">{homeworks.data?.totalElements ?? "—"}</span>
              </div>

              <div className="flex items-end justify-between rounded-2xl bg-white/80 p-4">
                <span className="text-sm text-slate-500">К выполнению</span>

                <span className="text-2xl font-semibold text-blue-700">{homeworks.data ? pendingCount : "—"}</span>
              </div>

              <div className="flex items-end justify-between rounded-2xl bg-white/80 p-4">
                <span className="text-sm text-slate-500">Выполнено</span>

                <span className="text-2xl font-semibold text-emerald-700">{homeworks.data ? completedCount : "—"}</span>
              </div>
            </div>

            <p className="mt-3 text-xs leading-5 text-slate-400">
              Счётчики выполнения относятся к текущей загруженной странице.
            </p>
          </section>
        </aside>
      </div>
    </main>
  );
}
