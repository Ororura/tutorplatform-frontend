"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BookOpenText, Layers3 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { StudentProfileNav } from "@/entities/student";
import { StudentProgramList, studentProgramQueries } from "@/entities/student-program";
import { AssignLearningProgramDialog } from "@/features/program/assign";
import { ApiClientError } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";

export function TeacherStudentProgramView({
  studentId,
}: Readonly<{
  studentId: string;
}>) {
  const programs = useQuery(studentProgramQueries.list(studentId));

  const router = useRouter();

  return (
    <main className="mx-auto max-w-[1280px] space-y-4">
      <section className="rounded-2xl border border-[var(--border)] bg-white p-6 sm:p-7">
        <Link
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600"
          href={`/teacher/students/${studentId}`}
        >
          <ArrowLeft size={16} />
          Профиль ученика
        </Link>

        <div className="mt-5 flex items-center gap-4">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <BookOpenText size={21} />
          </span>

          <div>
            <p className="text-sm font-medium text-blue-600">Учебный процесс</p>

            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">Программа обучения</h1>

            <p className="mt-2 text-sm text-slate-500">Назначенные ученику учебные программы.</p>
          </div>
        </div>
      </section>

      <StudentProfileNav active="program" studentId={studentId} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-w-0 rounded-2xl border border-[var(--border)] bg-white p-5 sm:p-6">
          {programs.isPending && (
            <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500" aria-busy="true">
              Загружаем программы…
            </p>
          )}

          {programs.isError && (
            <div className="space-y-3 rounded-2xl border border-red-100 bg-red-50 p-5" role="alert">
              <p className="text-sm text-red-700">
                {programs.error instanceof ApiClientError && programs.error.status === 404
                  ? "Ученик не найден"
                  : "Не удалось загрузить программы ученика."}
              </p>

              {!(programs.error instanceof ApiClientError && programs.error.status === 404) && (
                <Button type="button" variant="secondary" onClick={() => programs.refetch()}>
                  Повторить
                </Button>
              )}
            </div>
          )}

          {programs.data?.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-10 text-center">
              <BookOpenText size={28} className="mx-auto text-blue-500" />

              <p className="mt-4 font-semibold text-slate-950">У ученика пока нет программы обучения</p>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Назначьте программу, после чего можно будет добавлять занятия и домашние задания.
              </p>

              <div className="mt-5">
                <AssignLearningProgramDialog
                  studentId={studentId}
                  triggerLabel="Назначить программу"
                  onAssigned={(program) => router.push(`/teacher/students/${studentId}/programs/${program.id}`)}
                />
              </div>
            </div>
          )}

          {programs.data && programs.data.length > 0 && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">
                    {programs.data.length === 1 ? "Программа ученика" : "Программы ученика"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">Откройте программу, чтобы посмотреть модули и темы.</p>
                </div>

                <AssignLearningProgramDialog
                  studentId={studentId}
                  triggerLabel="Назначить ещё программу"
                  onAssigned={(program) => router.push(`/teacher/students/${studentId}/programs/${program.id}`)}
                />
              </div>

              <StudentProgramList
                programs={programs.data}
                getProgramHref={(programId) => `/teacher/students/${studentId}/programs/${programId}`}
              />
            </div>
          )}
        </section>

        <aside className="xl:sticky xl:top-28 xl:self-start">
          <section className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
            <span className="flex size-10 items-center justify-center rounded-xl bg-white text-blue-600">
              <Layers3 size={19} />
            </span>

            <h2 className="mt-4 font-semibold text-slate-950">Сводка по программам</h2>

            <div className="mt-5 flex items-end justify-between rounded-2xl bg-white/80 p-4">
              <span className="text-sm text-slate-500">Назначено</span>

              <span className="text-2xl font-semibold text-slate-950">{programs.data?.length ?? "—"}</span>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
