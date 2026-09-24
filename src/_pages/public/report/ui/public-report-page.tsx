"use client";

import { useQuery } from "@tanstack/react-query";
import { Clock3, FileText, Link2Off } from "lucide-react";

import {
  formatReportAssessment,
  formatReportAttendance,
  formatReportCompleted,
  formatReportLearningDuration,
  formatReportPeriod,
  reportQueries,
  type PublicProgressReport,
} from "@/entities/report";
import { ReportPdfDownloadButton } from "@/features/report/download";
import { ApiClientError } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";

const assessmentItems = [
  ["Понимание", "understandingAverage"],
  ["Самостоятельность", "independenceAverage"],
  ["Практика", "practiceAverage"],
  ["Домашние задания", "homeworkAverage"],
] as const;

export function PublicReportPage({ token }: Readonly<{ token: string }>) {
  const report = useQuery(reportQueries.publicDetail(token));

  if (report.isPending) return <LoadingState />;
  if (report.isError) return <ErrorState error={report.error} onRetry={() => void report.refetch()} />;

  return <ReportContent report={report.data} token={token} />;
}

function ReportContent({ report, token }: Readonly<{ report: PublicProgressReport; token: string }>) {
  const metrics = report.snapshot.metrics;
  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-5 sm:px-6 sm:py-10 lg:px-8">
      <header className="rounded-[24px] border border-white/80 bg-white p-5 shadow-[0_12px_40px_rgba(45,79,135,0.06)] sm:rounded-[28px] sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3 sm:gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 sm:size-12">
              <FileText size={21} aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-medium text-blue-600">Отчёт об успеваемости</p>
              <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                {formatReportPeriod(report.periodStartedAt, report.periodEndedAt)}
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Исторический отчёт: данные зафиксированы при публикации и не пересчитываются.
              </p>
            </div>
          </div>
          <ReportPdfDownloadButton audience="parent" token={token} />
        </div>
      </header>

      <section className="mt-4 rounded-[24px] border border-white/80 bg-white p-5 shadow-[0_12px_40px_rgba(45,79,135,0.06)] sm:mt-6 sm:rounded-[28px] sm:p-7">
        <h2 className="text-lg font-semibold text-slate-950 sm:text-xl">Результаты периода</h2>
        <dl className="mt-4 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-5">
          <Metric
            label="Учебное время"
            value={metrics?.learningMinutes === undefined ? "—" : formatReportLearningDuration(metrics.learningMinutes)}
            icon
          />
          <Metric label="Занятия" value={metrics?.sessionsCount?.toString() ?? "—"} />
          <Metric label="Посещаемость" value={formatReportAttendance(metrics?.attendanceRate)} />
          <Metric
            label="Домашние задания"
            value={formatReportCompleted(metrics?.homeworkCompleted, metrics?.homeworkAssigned)}
          />
          <Metric
            label="Практика"
            value={formatReportCompleted(metrics?.practiceCompleted, metrics?.practiceAssigned)}
          />
        </dl>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <TopicList title="Завершённые темы" topics={report.snapshot.topics?.completed} />
          <TopicList title="Темы в процессе" topics={report.snapshot.topics?.inProgress} />
        </div>

        <section className="mt-6" aria-labelledby="public-report-assessment-heading">
          <h3 id="public-report-assessment-heading" className="font-semibold text-slate-950">
            Средние оценки
          </h3>
          <dl className="mt-3 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4">
            {assessmentItems.map(([label, field]) => (
              <Metric key={field} label={label} value={formatReportAssessment(report.snapshot.assessment?.[field])} />
            ))}
          </dl>
        </section>

        {report.snapshot.skills?.length ? (
          <section className="mt-6" aria-labelledby="public-report-skills-heading">
            <h3 id="public-report-skills-heading" className="font-semibold text-slate-950">
              Навыки
            </h3>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {report.snapshot.skills.map((skill, index) => (
                <li
                  className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700"
                  key={`${skill.name ?? "skill"}-${index}`}
                >
                  {skill.name ?? "Навык"}
                  {skill.progress === undefined ? "" : ` — ${skill.progress}%`}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </section>

      <section className="mt-4 rounded-[24px] border border-white/80 bg-white p-5 shadow-[0_12px_40px_rgba(45,79,135,0.06)] sm:mt-6 sm:rounded-[28px] sm:p-7">
        <h2 className="text-lg font-semibold text-slate-950 sm:text-xl">Комментарий преподавателя</h2>
        <dl className="mt-4 space-y-4">
          <ReadonlyText label="Итоги периода" value={report.teacherSummary} />
          <ReadonlyText label="План на следующий период" value={report.nextPeriodPlan} />
        </dl>
      </section>
    </main>
  );
}

function LoadingState() {
  return (
    <main
      className="mx-auto min-h-screen w-full max-w-5xl space-y-4 px-4 py-5 sm:px-6 sm:py-10"
      aria-busy="true"
      aria-label="Загружаем отчёт"
    >
      <div className="h-44 animate-pulse rounded-[24px] bg-white sm:h-48" />
      <div className="grid gap-3 min-[420px]:grid-cols-2 lg:grid-cols-5">
        {[0, 1, 2, 3, 4].map((item) => (
          <div className="h-28 animate-pulse rounded-2xl bg-white" key={item} />
        ))}
      </div>
      <p className="text-sm text-slate-500">Загружаем отчёт…</p>
    </main>
  );
}

function ErrorState({ error, onRetry }: Readonly<{ error: Error; onRetry: () => void }>) {
  const status = error instanceof ApiClientError ? error.status : undefined;
  const terminal = status === 404 || status === 410;
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center px-4 py-8 sm:px-6">
      <div
        className={`w-full rounded-[24px] border p-6 text-center sm:p-8 ${terminal ? "border-slate-200 bg-slate-50" : "border-red-100 bg-red-50"}`}
        role="alert"
      >
        <Link2Off className="mx-auto text-slate-400" size={32} aria-hidden="true" />
        <h1 className="mt-4 text-xl font-semibold text-slate-950">
          {status === 404
            ? "Отчёт не найден"
            : status === 410
              ? "Ссылка больше не действует"
              : "Не удалось загрузить отчёт"}
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
          {status === 404
            ? "Проверьте адрес или запросите новую ссылку у преподавателя."
            : status === 410
              ? "Срок действия ссылки истёк или преподаватель отозвал доступ."
              : "Произошла ошибка сервера. Попробуйте ещё раз."}
        </p>
        {!terminal && (
          <Button className="mt-5" type="button" variant="secondary" onClick={onRetry}>
            Повторить
          </Button>
        )}
      </div>
    </main>
  );
}

function Metric({ label, value, icon = false }: Readonly<{ label: string; value: string; icon?: boolean }>) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="mt-1 inline-flex items-center gap-2 text-xl font-semibold text-slate-950">
        {icon && <Clock3 size={16} aria-hidden="true" />}
        {value}
      </dd>
    </div>
  );
}

function TopicList({ title, topics }: Readonly<{ title: string; topics?: Array<{ title?: string }> }>) {
  return (
    <section className="rounded-2xl border border-slate-200 p-4">
      <h3 className="font-semibold text-slate-950">{title}</h3>
      {topics?.length ? (
        <ul className="mt-3 space-y-2">
          {topics.map((topic, index) => (
            <li
              className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700"
              key={`${topic.title ?? "topic"}-${index}`}
            >
              {topic.title ?? "Без названия"}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-slate-500">Нет тем.</p>
      )}
    </section>
  );
}

function ReadonlyText({ label, value }: Readonly<{ label: string; value?: string | null }>) {
  return (
    <div>
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className="mt-2 whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 text-slate-800">{value || "Не заполнено"}</dd>
    </div>
  );
}
