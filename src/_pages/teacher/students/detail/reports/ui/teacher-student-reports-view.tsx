"use client";
import { Select } from "@/shared/ui/form-controls";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileText, Flag } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ProgressReportList, formatReportDate, reportQueries } from "@/entities/report";
import { StudentProfileNav } from "@/entities/student";
import { studentProgramQueries } from "@/entities/student-program";
import { useCreateProgressReportMutation } from "@/features/report/manage";
import { ApiClientError } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";

export function TeacherStudentReportsView({ studentId }: Readonly<{ studentId: string }>) {
  const router = useRouter();
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [createError, setCreateError] = useState("");
  const createReport = useCreateProgressReportMutation();
  const programs = useQuery(studentProgramQueries.list(studentId));
  const selectedProgramExists = programs.data?.some((program) => program.id === selectedProgramId) ?? false;
  const activeProgramId = selectedProgramExists ? selectedProgramId : (programs.data?.[0]?.id ?? "");
  const reports = useQuery({
    ...reportQueries.list({ studentProgramId: activeProgramId, sort: "periodEndedAt,desc" }),
    enabled: activeProgramId.length > 0,
  });
  const periods = useQuery({
    ...reportQueries.learningPeriods(studentId, activeProgramId),
    enabled: activeProgramId.length > 0,
  });
  const pendingPeriods = periods.data?.filter((period) => period.status === "COMPLETED" && !period.reportId) ?? [];

  const handleCreate = async (learningPeriodId: string) => {
    setCreateError("");
    try {
      const created = await createReport.mutateAsync({
        studentProgramId: activeProgramId,
        learningPeriodId,
      });
      router.push(`/teacher/students/${studentId}/reports/${created.id}`);
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 409) {
        if (error.body.code === "PROGRESS_REPORT_ALREADY_EXISTS") {
          setCreateError("Отчёт для этого периода уже существует. Список отчётов обновлён.");
          await Promise.all([reports.refetch(), periods.refetch()]);
          return;
        }
        setCreateError("Для этого периода нельзя создать отчёт. Обновите данные и попробуйте снова.");
        return;
      }
      setCreateError("Не удалось создать черновик отчёта.");
    }
  };

  return (
    <main className="page-content page-stack">
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
            <FileText size={21} />
          </span>
          <div>
            <p className="text-sm font-medium text-primary">Учебный процесс</p>
            <h1 className="page-title mt-1">Отчёты об успеваемости</h1>
            <p className="mt-2 text-sm text-foreground-muted">История отчётов по завершённым учебным периодам.</p>
          </div>
        </div>
      </section>

      <StudentProfileNav active="reports" studentId={studentId} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="surface min-w-0">
          <h2 className="section-title">Отчёты</h2>
          <p className="mt-1 text-sm text-foreground-muted">
            Выберите программу, чтобы посмотреть связанные с ней отчёты.
          </p>

          {programs.isPending && (
            <p className="mt-5 rounded-surface bg-surface-subtle p-5 text-sm text-foreground-muted" aria-busy="true">
              Загружаем программы…
            </p>
          )}
          {programs.isError && (
            <div
              className="mt-5 space-y-3 rounded-surface border border-danger-border bg-danger-subtle p-5"
              role="alert"
            >
              <p className="text-sm text-danger">Не удалось загрузить программы ученика.</p>
              <Button type="button" variant="secondary" onClick={() => programs.refetch()}>
                Повторить
              </Button>
            </div>
          )}
          {programs.data?.length === 0 && (
            <div className="mt-5 rounded-surface border border-dashed border-border bg-surface-subtle/60 p-10 text-center">
              <FileText size={28} className="mx-auto text-primary" />
              <p className="mt-4 font-semibold text-foreground">Нет программ для отчётов</p>
              <Link
                className="mt-4 inline-flex text-sm font-medium text-primary hover:text-primary"
                href={`/teacher/students/${studentId}/program`}
              >
                Перейти в раздел «Программа»
              </Link>
            </div>
          )}

          {programs.data && programs.data.length > 0 && (
            <>
              <label
                className="mt-5 block max-w-xl text-sm font-medium text-foreground-muted"
                htmlFor="student-reports-program"
              >
                Программа обучения
                <Select
                  id="student-reports-program"
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
              </label>

              <div className="mt-5">
                {reports.isPending && (
                  <p className="rounded-surface bg-surface-subtle p-5 text-sm text-foreground-muted" aria-busy="true">
                    Загружаем отчёты…
                  </p>
                )}
                {reports.isError && (
                  <div
                    className="space-y-3 rounded-surface border border-danger-border bg-danger-subtle p-5"
                    role="alert"
                  >
                    <p className="text-sm text-danger">Не удалось загрузить отчёты.</p>
                    <Button type="button" variant="secondary" onClick={() => reports.refetch()}>
                      Повторить
                    </Button>
                  </div>
                )}
                {reports.data?.items.length === 0 && (
                  <div className="rounded-surface border border-dashed border-border bg-surface-subtle/60 p-10 text-center">
                    <FileText size={28} className="mx-auto text-primary" />
                    <p className="mt-4 font-semibold text-foreground">Отчётов пока нет</p>
                    <p className="mt-2 text-sm text-foreground-muted">
                      Завершённые периоды без отчёта показаны справа.
                    </p>
                  </div>
                )}
                {reports.data && reports.data.items.length > 0 && (
                  <ProgressReportList reports={reports.data.items} studentId={studentId} />
                )}
              </div>
            </>
          )}
        </section>

        <aside className="xl:sticky xl:top-28 xl:self-start">
          <section className="rounded-surface border border-primary-border bg-surface-subtle p-6">
            <Flag size={20} className="text-primary" />
            <h2 className="section-title mt-4">Ожидают отчёта</h2>
            {periods.isPending && (
              <p className="mt-3 text-sm text-foreground-muted" aria-busy="true">
                Загружаем периоды…
              </p>
            )}
            {periods.isError && <p className="mt-3 text-sm text-danger">Не удалось загрузить учебные периоды.</p>}
            {periods.data && pendingPeriods.length === 0 && (
              <p className="mt-3 text-sm text-foreground-muted">Все завершённые периоды уже имеют отчёт.</p>
            )}
            {pendingPeriods.length > 0 && (
              <ol className="mt-4 space-y-3">
                {pendingPeriods.map((period) => (
                  <li key={period.id} className="rounded-surface bg-surface/80 p-4">
                    <p className="font-medium text-foreground">Период {period.sequenceNo}</p>
                    <p className="mt-1 text-sm text-foreground-muted">
                      Завершён {period.completedAt ? formatReportDate(period.completedAt) : "—"}
                    </p>
                    <Button
                      type="button"
                      className="mt-3 w-full"
                      aria-label={`Создать черновик для периода ${period.sequenceNo}`}
                      disabled={createReport.isPending}
                      onClick={() => handleCreate(period.id)}
                    >
                      {createReport.isPending ? "Создаём…" : "Создать черновик"}
                    </Button>
                  </li>
                ))}
              </ol>
            )}
            {createError && (
              <p className="mt-4 text-sm text-danger" role="alert">
                {createError}
              </p>
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}
