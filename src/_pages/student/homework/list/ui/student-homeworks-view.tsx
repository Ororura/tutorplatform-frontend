"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import {
  formatHomeworkDate,
  getStudentHomeworkPresentationState,
  studentHomeworkQueries,
  studentHomeworkStatusPresentation,
} from "@/entities/homework";
import { Button } from "@/shared/ui/button";

export function StudentHomeworksView() {
  const homeworks = useQuery(studentHomeworkQueries.list({ page: 0, size: 20, sort: "assignedAt,desc" }));

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-6 py-12">
      <header>
        <p className="text-sm font-medium text-neutral-500">Student Workspace</p>
        <h1 className="mt-1 text-3xl font-semibold">Домашние задания</h1>
      </header>
      {homeworks.isPending && <p aria-busy="true">Загружаем домашние задания…</p>}
      {homeworks.isError && (
        <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-5" role="alert">
          <p>Не удалось загрузить домашние задания.</p>
          <Button type="button" onClick={() => homeworks.refetch()}>
            Повторить
          </Button>
        </div>
      )}
      {homeworks.data?.items.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="font-medium">Домашних заданий пока нет</p>
        </div>
      )}
      {homeworks.data && homeworks.data.items.length > 0 && (
        <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
          {homeworks.data.items.map((homework) => {
            const state = getStudentHomeworkPresentationState(homework);
            return (
              <li key={homework.id}>
                <Link
                  className="flex flex-col gap-3 p-4 transition hover:bg-neutral-50 sm:flex-row sm:items-center sm:justify-between"
                  href={`/student/homework/${homework.id}`}
                >
                  <span>
                    <span className="font-medium">{homework.title}</span>
                    <span className="mt-1 block text-sm text-neutral-500">
                      Назначено {formatHomeworkDate(homework.assignedAt)}
                      {homework.dueAt ? ` · срок ${formatHomeworkDate(homework.dueAt)}` : " · без срока"}
                      {homework.completedAt ? ` · Выполнено ${formatHomeworkDate(homework.completedAt)}` : ""}
                    </span>
                  </span>
                  <span
                    className={`w-fit rounded-full px-2.5 py-1 text-xs ${
                      state === "OVERDUE" ? "bg-red-50 text-red-800" : "bg-neutral-100 text-neutral-700"
                    }`}
                  >
                    {studentHomeworkStatusPresentation[state]}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
