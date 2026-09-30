"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpenText, ClipboardCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { StudentDashboardHeader } from "./student-dashboard-header";

import { StudentHomeworkList, studentHomeworkQueries } from "@/entities/homework";
import { StudentProgramList, studentProgramQueries } from "@/entities/student-program";
import { Button } from "@/shared/ui/button";

const previewSize = 3;

function SectionLink({ href, children }: Readonly<{ href: string; children: React.ReactNode }>) {
  return (
    <Link className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700" href={href}>
      {children}
      <ArrowRight size={16} aria-hidden="true" />
    </Link>
  );
}

export function StudentLandingPage() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const programs = useQuery(studentProgramQueries.currentList());
  const homeworks = useQuery(
    studentHomeworkQueries.list({
      status: "ASSIGNED",
      page: 0,
      size: previewSize,
      sort: "dueAt,asc",
    }),
  );

  return (
    <main className="space-y-4">
      <StudentDashboardHeader
        now={now}
        attentionCount={homeworks.isError ? undefined : homeworks.data?.totalElements}
        nearest={
          homeworks.isError ? undefined : homeworks.data?.items.find((item) => item.status === "ASSIGNED" && item.dueAt)
        }
      />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.8fr)_minmax(320px,1fr)]">
        <section className="min-w-0 rounded-2xl border border-[var(--border)] bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Домашние задания</h2>
              <p className="mt-1 text-sm text-slate-500">Задания, которые нужно выполнить.</p>
            </div>
            <SectionLink href="/student/homework">Все задания</SectionLink>
          </div>

          <div className="mt-5">
            {homeworks.isPending && (
              <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500" aria-busy="true">
                Загружаем домашние задания…
              </p>
            )}

            {homeworks.isError && (
              <div className="space-y-3 rounded-2xl border border-red-100 bg-red-50 p-5" role="alert">
                <p className="text-sm text-red-700">Не удалось загрузить домашние задания.</p>
                <Button type="button" variant="secondary" onClick={() => homeworks.refetch()}>
                  Повторить
                </Button>
              </div>
            )}

            {homeworks.data?.items.length === 0 && (
              <div className="rounded-xl bg-[var(--surface-muted)] px-4 py-6 text-center">
                <ClipboardCheck size={28} className="mx-auto text-blue-500" aria-hidden="true" />
                <p className="mt-3 font-semibold text-slate-950">Невыполненных заданий нет</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">Новые задания преподавателя появятся здесь.</p>
              </div>
            )}

            {homeworks.data && homeworks.data.items.length > 0 && (
              <StudentHomeworkList homeworks={homeworks.data.items} />
            )}
          </div>
        </section>

        <section className="min-w-0 rounded-2xl border border-[var(--border)] bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Мои программы</h2>
              <p className="mt-1 text-sm text-slate-500">Программы, назначенные преподавателем.</p>
            </div>
            <SectionLink href="/student/programs">Все программы</SectionLink>
          </div>

          <div className="mt-5">
            {programs.isPending && (
              <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500" aria-busy="true">
                Загружаем программы…
              </p>
            )}

            {programs.isError && (
              <div className="space-y-3 rounded-2xl border border-red-100 bg-red-50 p-5" role="alert">
                <p className="text-sm text-red-700">Не удалось загрузить ваши программы.</p>
                <Button type="button" variant="secondary" onClick={() => programs.refetch()}>
                  Повторить
                </Button>
              </div>
            )}

            {programs.data?.length === 0 && (
              <div className="rounded-xl bg-[var(--surface-muted)] px-4 py-6 text-center">
                <BookOpenText size={28} className="mx-auto text-blue-500" aria-hidden="true" />
                <p className="mt-3 font-semibold text-slate-950">Программ пока нет</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Назначенные преподавателем программы появятся здесь.
                </p>
              </div>
            )}

            {programs.data && programs.data.length > 0 && (
              <StudentProgramList programs={programs.data.slice(0, previewSize)} />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
