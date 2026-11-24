"use client";

import { useQuery } from "@tanstack/react-query";
import { Clock3 } from "lucide-react";

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
import { LoadingState } from "@/shared/ui/feedback";
import { PageHeader } from "@/shared/ui/page-header";
import { PublicPageShell } from "../../ui/public-page-shell";

const assessmentItems = [
  ["Понимание", "understandingAverage"],
  ["Самостоятельность", "independenceAverage"],
  ["Практика", "practiceAverage"],
  ["Домашние задания", "homeworkAverage"],
] as const;

export function PublicReportPage({ token }: Readonly<{ token: string }>) {
  const report = useQuery(reportQueries.publicDetail(token));

  return (
    <PublicPageShell>
      {report.isPending && <LoadingState label="Загружаем отчёт">Загружаем отчёт…</LoadingState>}
      {report.isError && <ReportError error={report.error} onRetry={() => void report.refetch()} />}
      {report.data && !report.isError && <ReportContent report={report.data} token={token} />}
    </PublicPageShell>
  );
}

function ReportContent({ report, token }: Readonly<{ report: PublicProgressReport; token: string }>) {
  const metrics = report.snapshot.metrics;
  return (
    <>
      <PageHeader
        title={formatReportPeriod(report.periodStartedAt, report.periodEndedAt)}
        eyebrow="Отчёт об успеваемости"
        description="Исторический отчёт: данные зафиксированы при публикации и не пересчитываются."
        actions={<ReportPdfDownloadButton audience="parent" token={token} />}
      />

      <section className="surface">
        <h2 className="section-title">Результаты периода</h2>
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
          <h3 id="public-report-assessment-heading" className="font-semibold text-foreground">
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
            <h3 id="public-report-skills-heading" className="font-semibold text-foreground">
              Навыки
            </h3>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {report.snapshot.skills.map((skill, index) => (
                <li
                  className="rounded-surface bg-surface-subtle px-3 py-2 text-sm text-foreground-muted"
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

      <section className="surface">
        <h2 className="section-title">Комментарий преподавателя</h2>
        <dl className="mt-4 space-y-4">
          <ReadonlyText label="Итоги периода" value={report.teacherSummary} />
          <ReadonlyText label="План на следующий период" value={report.nextPeriodPlan} />
        </dl>
      </section>
    </>
  );
}

function ReportError({ error, onRetry }: Readonly<{ error: Error; onRetry: () => void }>) {
  const status = error instanceof ApiClientError ? error.status : undefined;
  const terminal = status === 404 || status === 410;
  return (
    <div className="page-stack" role="alert">
      <PageHeader
        title={
          status === 404
            ? "Отчёт не найден"
            : status === 410
              ? "Ссылка больше не действует"
              : "Не удалось загрузить отчёт"
        }
        eyebrow="Отчёт об успеваемости"
      />
      <div className="surface space-y-3">
        <p className="page-description">
          {status === 404
            ? "Проверьте адрес или запросите новую ссылку у преподавателя."
            : status === 410
              ? "Срок действия ссылки истёк или преподаватель отозвал доступ."
              : "Произошла ошибка сервера. Попробуйте ещё раз."}
        </p>
        {!terminal && (
          <Button type="button" variant="secondary" onClick={onRetry}>
            Повторить
          </Button>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value, icon = false }: Readonly<{ label: string; value: string; icon?: boolean }>) {
  return (
    <div className="rounded-surface bg-surface-subtle p-4">
      <dt className="text-sm text-foreground-muted">{label}</dt>
      <dd className="mt-1 inline-flex items-center gap-2 text-xl font-semibold text-foreground">
        {icon && <Clock3 size={16} aria-hidden="true" />}
        {value}
      </dd>
    </div>
  );
}

function TopicList({ title, topics }: Readonly<{ title: string; topics?: Array<{ title?: string }> }>) {
  return (
    <section className="rounded-surface border border-border p-4">
      <h3 className="font-semibold text-foreground">{title}</h3>
      {topics?.length ? (
        <ul className="mt-3 space-y-2">
          {topics.map((topic, index) => (
            <li
              className="rounded-surface bg-surface-subtle px-3 py-2 text-sm text-foreground-muted"
              key={`${topic.title ?? "topic"}-${index}`}
            >
              {topic.title ?? "Без названия"}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-foreground-muted">Нет тем.</p>
      )}
    </section>
  );
}

function ReadonlyText({ label, value }: Readonly<{ label: string; value?: string | null }>) {
  return (
    <div>
      <dt className="text-sm font-medium text-foreground-muted">{label}</dt>
      <dd className="mt-2 whitespace-pre-wrap rounded-surface bg-surface-subtle p-4 text-foreground">
        {value || "Не заполнено"}
      </dd>
    </div>
  );
}
