"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock3, FileText } from "lucide-react";
import Link from "next/link";

import {
  formatReportLearningDuration,
  formatReportPeriod,
  progressReportStatusClassNames,
  progressReportStatusLabels,
  reportQueries,
} from "@/entities/report";
import { Button } from "@/shared/ui/button";

export function TeacherStudentReportDetailView({
  studentId,
  reportId,
}: Readonly<{
  studentId: string;
  reportId: string;
}>) {
  const report = useQuery(reportQueries.detail(reportId));

  if (report.isPending) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-12">
        <p aria-busy="true">Загружаем отчёт…</p>
      </main>
    );
  }

  if (report.isError) {
    return (
      <main className="mx-auto max-w-4xl space-y-4 px-6 py-12">
        <div className="space-y-3 rounded-2xl border border-red-100 bg-red-50 p-5" role="alert">
          <p className="text-sm text-red-700">Не удалось загрузить отчёт.</p>
          <Button type="button" variant="secondary" onClick={() => report.refetch()}>
            Повторить
          </Button>
        </div>
        <Link className="text-sm font-medium text-blue-600" href={`/teacher/students/${studentId}/reports`}>
          Вернуться к отчётам
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl space-y-5 px-6 py-12">
      <Link
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600"
        href={`/teacher/students/${studentId}/reports`}
      >
        <ArrowLeft size={16} /> Все отчёты
      </Link>
      <section className="rounded-[28px] border border-white/80 bg-white p-6 shadow-[0_12px_40px_rgba(45,79,135,0.06)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <FileText size={21} />
            </span>
            <div>
              <p className="text-sm font-medium text-blue-600">Отчёт об успеваемости</p>
              <h1 className="mt-1 text-2xl font-semibold text-slate-950">
                {formatReportPeriod(report.data.periodStartedAt, report.data.periodEndedAt)}
              </h1>
            </div>
          </div>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${progressReportStatusClassNames[report.data.status]}`}
          >
            {progressReportStatusLabels[report.data.status]}
          </span>
        </div>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-4">
            <dt className="text-sm text-slate-500">Учебное время</dt>
            <dd className="mt-1 inline-flex items-center gap-2 font-semibold text-slate-950">
              <Clock3 size={16} />
              {formatReportLearningDuration(report.data.learningMinutes)}
            </dd>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <dt className="text-sm text-slate-500">Статус</dt>
            <dd className="mt-1 font-semibold text-slate-950">{progressReportStatusLabels[report.data.status]}</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
