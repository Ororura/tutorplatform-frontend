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
    <main className="page-stack">
      <section className="surface sm:p-7">
        <Link
          className="inline-flex items-center gap-2 text-sm font-medium text-foreground-muted transition hover:text-primary"
          href={`/teacher/students/${studentId}`}
        >
          <ArrowLeft size={16} />
          Профиль ученика
        </Link>

        <div className="mt-5 flex items-center gap-4">
          <span className="flex size-12 items-center justify-center rounded-surface bg-primary-subtle text-primary">
            <BookOpenText size={21} />
          </span>

          <div>
            <p className="text-sm font-medium text-primary">Учебный процесс</p>

            <h1 className="page-title mt-1">Программа обучения</h1>

            <p className="mt-2 text-sm text-foreground-muted">Назначенные ученику учебные программы.</p>
          </div>
        </div>
      </section>

      <StudentProfileNav active="program" studentId={studentId} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="surface min-w-0">
          {programs.isPending && (
            <p className="rounded-surface bg-surface-subtle p-5 text-sm text-foreground-muted" aria-busy="true">
              Загружаем программы…
            </p>
          )}

          {programs.isError && (
            <div className="space-y-3 rounded-surface border border-danger-border bg-danger-subtle p-5" role="alert">
              <p className="text-sm text-danger">
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
            <div className="rounded-surface border border-dashed border-border bg-surface-subtle/60 p-10 text-center">
              <BookOpenText size={28} className="mx-auto text-primary" />

              <p className="mt-4 font-semibold text-foreground">У ученика пока нет программы обучения</p>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-foreground-muted">
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
                  <h2 className="section-title">
                    {programs.data.length === 1 ? "Программа ученика" : "Программы ученика"}
                  </h2>

                  <p className="mt-1 text-sm text-foreground-muted">
                    Откройте программу, чтобы посмотреть модули и темы.
                  </p>
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
          <section className="rounded-surface border border-primary-border bg-surface-subtle p-6">
            <span className="flex size-10 items-center justify-center rounded-surface bg-surface text-primary">
              <Layers3 size={19} />
            </span>

            <h2 className="section-title mt-4">Сводка по программам</h2>

            <div className="mt-5 flex items-end justify-between rounded-surface bg-surface/80 p-4">
              <span className="text-sm text-foreground-muted">Назначено</span>

              <span className="text-2xl font-semibold text-foreground">{programs.data?.length ?? "—"}</span>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
