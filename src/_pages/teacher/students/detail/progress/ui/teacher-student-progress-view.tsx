"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChartNoAxesCombined } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { CurrentProgressOverview, progressQueries } from "@/entities/progress";
import { StudentProfileNav } from "@/entities/student";
import { studentProgramQueries } from "@/entities/student-program";
import { Button } from "@/shared/ui/button";

export function TeacherStudentProgressView({ studentId }: Readonly<{ studentId: string }>) {
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const programs = useQuery(studentProgramQueries.list(studentId));

  const selectedProgramExists = programs.data?.some((program) => program.id === selectedProgramId) ?? false;
  const activeProgramId = selectedProgramExists ? selectedProgramId : (programs.data?.[0]?.id ?? "");

  const progress = useQuery({
    ...progressQueries.detail(studentId, activeProgramId),
    enabled: activeProgramId.length > 0,
  });

  return (
    <main className="mx-auto max-w-[1280px] space-y-4">
      <section className="rounded-[28px] border border-white/80 bg-white p-6 shadow-[0_12px_40px_rgba(45,79,135,0.06)] sm:p-7">
        <Link
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600"
          href={`/teacher/students/${studentId}`}
        >
          <ArrowLeft size={16} />
          Профиль ученика
        </Link>

        <div className="mt-5 flex items-center gap-4">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <ChartNoAxesCombined size={21} />
          </span>

          <div>
            <p className="text-sm font-medium text-blue-600">Учебный процесс</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">Прогресс ученика</h1>
            <p className="mt-2 text-sm text-slate-500">Показатели обучения по назначенной программе.</p>
          </div>
        </div>
      </section>

      <StudentProfileNav active="progress" studentId={studentId} />

      <section className="rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_12px_40px_rgba(45,79,135,0.06)] sm:p-6">
        {programs.isPending && (
          <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500" aria-busy="true">
            Загружаем программы…
          </p>
        )}

        {programs.isError && (
          <div className="space-y-3 rounded-2xl border border-red-100 bg-red-50 p-5" role="alert">
            <p className="text-sm text-red-700">Не удалось загрузить программы ученика.</p>
            <Button type="button" variant="secondary" onClick={() => programs.refetch()}>
              Повторить
            </Button>
          </div>
        )}

        {programs.data?.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-10 text-center">
            <ChartNoAxesCombined size={28} className="mx-auto text-blue-500" />
            <p className="mt-4 font-semibold text-slate-950">Нет программ для отображения прогресса</p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Сначала назначьте ученику программу обучения.
            </p>
            <Link
              className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700"
              href={`/teacher/students/${studentId}/program`}
            >
              Перейти к программам
            </Link>
          </div>
        )}

        {programs.data && programs.data.length > 0 && (
          <div className="space-y-6">
            <div className="max-w-xl">
              <label htmlFor="student-progress-program" className="text-sm font-medium text-slate-700">
                Программа обучения
              </label>
              <select
                id="student-progress-program"
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-3 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-600"
                value={activeProgramId}
                disabled={programs.data.length === 1}
                onChange={(event) => setSelectedProgramId(event.target.value)}
              >
                {programs.data.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.title}
                  </option>
                ))}
              </select>
            </div>

            {progress.isPending && (
              <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500" aria-busy="true">
                Загружаем прогресс…
              </p>
            )}

            {progress.isError && (
              <div className="space-y-3 rounded-2xl border border-red-100 bg-red-50 p-5" role="alert">
                <p className="text-sm text-red-700">Не удалось загрузить прогресс ученика.</p>
                <Button type="button" variant="secondary" onClick={() => progress.refetch()}>
                  Повторить
                </Button>
              </div>
            )}

            {progress.data && <CurrentProgressOverview progress={progress.data} />}
          </div>
        )}
      </section>
    </main>
  );
}
