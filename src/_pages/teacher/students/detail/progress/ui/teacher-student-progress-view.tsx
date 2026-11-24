"use client";
import { PageBackLink, PageHeader } from "@/shared/ui/page-header";
import { Select } from "@/shared/ui/form-controls";

import { useQuery } from "@tanstack/react-query";
import { ChartNoAxesCombined } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { CurrentProgressOverview, progressQueries } from "@/entities/progress";
import { StudentProfileNav } from "@/entities/student";
import { studentProgramQueries } from "@/entities/student-program";
import { Button, buttonClassName } from "@/shared/ui/button";

import { ProgressShareManagement } from "./progress-share-management";

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
    <main className="page-stack">
      <PageHeader
        title="Прогресс ученика"
        description="Показатели обучения по назначенной программе."
        navigation={<PageBackLink href={`/teacher/students/${studentId}`}>Профиль ученика</PageBackLink>}
      />

      <StudentProfileNav active="progress" studentId={studentId} />

      <section className="surface">
        {programs.isPending && (
          <p className="rounded-surface bg-surface-subtle p-5 text-sm text-foreground-muted" aria-busy="true">
            Загружаем программы…
          </p>
        )}

        {programs.isError && (
          <div className="space-y-3 rounded-surface border border-danger-border bg-danger-subtle p-5" role="alert">
            <p className="text-sm text-danger">Не удалось загрузить программы ученика.</p>
            <Button type="button" variant="secondary" onClick={() => programs.refetch()}>
              Повторить
            </Button>
          </div>
        )}

        {programs.data?.length === 0 && (
          <div className="rounded-surface border border-dashed border-border bg-surface-subtle/60 p-10 text-center">
            <ChartNoAxesCombined size={28} className="mx-auto text-primary" />
            <p className="mt-4 font-semibold text-foreground">Нет программ для отображения прогресса</p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-foreground-muted">
              Сначала назначьте ученику программу обучения.
            </p>
            <Link className={buttonClassName("primary", "mt-5")} href={`/teacher/students/${studentId}/program`}>
              Перейти к программам
            </Link>
          </div>
        )}

        {programs.data && programs.data.length > 0 && (
          <div className="space-y-6">
            <div className="max-w-xl">
              <label htmlFor="student-progress-program" className="text-sm font-medium text-foreground-muted">
                Программа обучения
              </label>
              <Select
                id="student-progress-program"
                className="mt-2"
                value={activeProgramId}
                disabled={programs.data.length === 1}
                onChange={(event) => setSelectedProgramId(event.target.value)}
              >
                {programs.data.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.title}
                  </option>
                ))}
              </Select>
            </div>

            {progress.isPending && (
              <p className="rounded-surface bg-surface-subtle p-5 text-sm text-foreground-muted" aria-busy="true">
                Загружаем прогресс…
              </p>
            )}

            {progress.isError && (
              <div className="space-y-3 rounded-surface border border-danger-border bg-danger-subtle p-5" role="alert">
                <p className="text-sm text-danger">Не удалось загрузить прогресс ученика.</p>
                <Button type="button" variant="secondary" onClick={() => progress.refetch()}>
                  Повторить
                </Button>
              </div>
            )}

            {progress.data && <CurrentProgressOverview progress={progress.data} />}
          </div>
        )}
      </section>

      {activeProgramId && <ProgressShareManagement studentId={studentId} studentProgramId={activeProgramId} />}
    </main>
  );
}
