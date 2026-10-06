"use client";
import { Textarea } from "@/shared/ui/form-controls";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock3, FileText } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import {
  formatReportAssessment,
  formatReportAttendance,
  formatReportCompleted,
  formatReportLearningDuration,
  formatReportPeriod,
  type ProgressReportDetails,
  progressReportStatusClassNames,
  progressReportStatusLabels,
  reportQueries,
} from "@/entities/report";
import { usePublishProgressReportMutation, useUpdateProgressReportMutation } from "@/features/report/manage";
import { ApiClientError } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";

import { ReportPublicationManagement } from "./report-publication-management";

const assessmentItems = [
  ["Понимание", "understandingAverage"],
  ["Самостоятельность", "independenceAverage"],
  ["Практика", "practiceAverage"],
  ["Домашние задания", "homeworkAverage"],
] as const;

function mutationErrorMessage(error: unknown): string {
  if (!(error instanceof ApiClientError) || error.status !== 409) {
    return "Не удалось выполнить действие. Попробуйте ещё раз.";
  }
  if (error.body.code === "OPTIMISTIC_LOCK_CONFLICT") {
    return "Отчёт был изменён в другой вкладке. Обновите данные и повторите действие.";
  }
  if (error.body.code === "PROGRESS_REPORT_NOT_EDITABLE") {
    return "Отчёт больше нельзя редактировать: его статус изменился. Обновите данные.";
  }
  if (error.body.code === "PROGRESS_REPORT_NOT_PUBLISHABLE") {
    return "Отчёт нельзя опубликовать из текущего статуса. Обновите данные.";
  }
  return "Состояние отчёта изменилось. Обновите данные и повторите действие.";
}

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
      <main className="page-content page-stack">
        <p aria-busy="true">Загружаем отчёт…</p>
      </main>
    );
  }

  if (report.isError) {
    return (
      <main className="page-content page-stack">
        <div className="space-y-3 rounded-surface border border-danger-border bg-danger-subtle p-5" role="alert">
          <p className="text-sm text-danger">Не удалось загрузить отчёт.</p>
          <Button type="button" variant="secondary" onClick={() => report.refetch()}>
            Повторить
          </Button>
        </div>
        <Link className="text-sm font-medium text-primary" href={`/teacher/students/${studentId}/reports`}>
          Вернуться к отчётам
        </Link>
      </main>
    );
  }

  return (
    <ReportDetails
      report={report.data}
      studentId={studentId}
      onReload={async () => {
        return (await report.refetch()).data;
      }}
    />
  );
}

function ReportDetails({
  report,
  studentId,
  onReload,
}: Readonly<{
  report: ProgressReportDetails;
  studentId: string;
  onReload: () => Promise<ProgressReportDetails | undefined>;
}>) {
  const [teacherSummary, setTeacherSummary] = useState(report.teacherSummary ?? "");
  const [nextPeriodPlan, setNextPeriodPlan] = useState(report.nextPeriodPlan ?? "");
  const [version, setVersion] = useState(report.version);
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const updateReport = useUpdateProgressReportMutation(report.id);
  const publishReport = usePublishProgressReportMutation(report.id);
  const editable = report.status === "DRAFT";
  const dirty = teacherSummary !== (report.teacherSummary ?? "") || nextPeriodPlan !== (report.nextPeriodPlan ?? "");
  const busy = updateReport.isPending || publishReport.isPending;
  const metrics = report.snapshot.metrics;

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editable || busy) return;
    setActionError("");
    setNotice("");
    try {
      const updated = await updateReport.mutateAsync({
        teacherSummary: teacherSummary.trim() || null,
        nextPeriodPlan: nextPeriodPlan.trim() || null,
        version,
      });
      setTeacherSummary(updated.teacherSummary ?? "");
      setNextPeriodPlan(updated.nextPeriodPlan ?? "");
      setVersion(updated.version);
      setNotice("Черновик сохранён.");
    } catch (error) {
      setActionError(mutationErrorMessage(error));
    }
  };

  const publish = async () => {
    if (!editable || dirty || busy) return;
    if (!window.confirm("Опубликовать отчёт? После публикации его нельзя будет редактировать.")) return;
    setActionError("");
    setNotice("");
    try {
      await publishReport.mutateAsync({ version });
      setNotice("Отчёт опубликован.");
    } catch (error) {
      setActionError(mutationErrorMessage(error));
    }
  };

  const reload = async () => {
    setActionError("");
    setNotice("");
    const refreshed = await onReload();
    if (refreshed) {
      setTeacherSummary(refreshed.teacherSummary ?? "");
      setNextPeriodPlan(refreshed.nextPeriodPlan ?? "");
      setVersion(refreshed.version);
    }
  };

  return (
    <main className="page-content page-stack">
      <Link
        className="inline-flex items-center gap-2 text-sm font-medium text-foreground-muted hover:text-primary"
        href={`/teacher/students/${studentId}/reports`}
      >
        <ArrowLeft size={16} /> Все отчёты
      </Link>

      <section className="surface">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex size-12 items-center justify-center rounded-surface bg-primary-subtle text-primary">
              <FileText size={21} />
            </span>
            <div>
              <p className="text-sm font-medium text-primary">Отчёт об успеваемости</p>
              <h1 className="page-title mt-1">{formatReportPeriod(report.periodStartedAt, report.periodEndedAt)}</h1>
            </div>
          </div>
          <span className={`badge  ${progressReportStatusClassNames[report.status]}`}>
            {progressReportStatusLabels[report.status]}
          </span>
        </div>
        {!editable && (
          <p className="mt-5 rounded-surface bg-surface-subtle p-4 text-sm text-foreground-muted">
            Этот отчёт хранит исторический snapshot и доступен только для чтения.
          </p>
        )}
      </section>

      <ReportPublicationManagement reportId={report.id} status={report.status} />

      <section className="surface" aria-labelledby="report-snapshot-heading">
        <h2 id="report-snapshot-heading" className="section-title">
          Результаты периода
        </h2>
        <p className="mt-1 text-sm text-foreground-muted">Зафиксированы при создании отчёта и не пересчитываются.</p>

        <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Metric
            label="Учебное время"
            value={metrics?.learningMinutes === undefined ? "—" : formatReportLearningDuration(metrics.learningMinutes)}
          />
          <Metric label="Занятия" value={metrics?.sessionsCount?.toString() ?? "—"} />
          <Metric label="Посещаемость" value={formatReportAttendance(metrics?.attendanceRate)} />
          <Metric
            label="Домашние задания"
            value={formatReportCompleted(metrics?.homeworkCompleted, metrics?.homeworkAssigned)}
            hint="Выполнено из назначенных"
          />
          <Metric
            label="Практика"
            value={formatReportCompleted(metrics?.practiceCompleted, metrics?.practiceAssigned)}
            hint="Выполнено из назначенных"
          />
        </dl>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <TopicList title="Завершённые темы" topics={report.snapshot.topics?.completed} />
          <TopicList title="Темы в процессе" topics={report.snapshot.topics?.inProgress} />
        </div>

        <section className="mt-6" aria-labelledby="report-assessments-heading">
          <h3 id="report-assessments-heading" className="font-semibold text-foreground">
            Средние оценки
          </h3>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {assessmentItems.map(([label, field]) => (
              <Metric key={field} label={label} value={formatReportAssessment(report.snapshot.assessment?.[field])} />
            ))}
          </dl>
        </section>
      </section>

      <section className="surface">
        <h2 className="section-title">Комментарий преподавателя</h2>
        {editable ? (
          <form className="mt-5 space-y-5" onSubmit={save}>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground-muted">Итоги периода</span>
              <Textarea
                className="min-h-36 resize-y"
                value={teacherSummary}
                onChange={(event) => setTeacherSummary(event.target.value)}
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground-muted">План на следующий период</span>
              <Textarea
                className="min-h-36 resize-y"
                value={nextPeriodPlan}
                onChange={(event) => setNextPeriodPlan(event.target.value)}
              />
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={busy || !dirty}>
                {updateReport.isPending ? "Сохраняем…" : "Сохранить черновик"}
              </Button>
              <Button type="button" variant="secondary" disabled={busy || dirty} onClick={publish}>
                {publishReport.isPending ? "Публикуем…" : "Опубликовать"}
              </Button>
              {dirty && <p className="text-sm text-foreground-muted">Сохраните изменения перед публикацией.</p>}
            </div>
          </form>
        ) : (
          <dl className="mt-5 space-y-5">
            <ReadonlyText label="Итоги периода" value={report.teacherSummary} />
            <ReadonlyText label="План на следующий период" value={report.nextPeriodPlan} />
          </dl>
        )}

        {actionError && (
          <div
            className="mt-5 flex flex-wrap items-center gap-3 rounded-surface border border-danger-border bg-danger-subtle p-4"
            role="alert"
          >
            <p className="flex-1 text-sm text-danger">{actionError}</p>
            <Button type="button" variant="secondary" onClick={reload}>
              Обновить данные
            </Button>
          </div>
        )}
        {notice && (
          <p className="mt-5 rounded-surface bg-success-subtle p-4 text-sm text-success" role="status">
            {notice}
          </p>
        )}
      </section>
    </main>
  );
}

function Metric({ label, value, hint }: Readonly<{ label: string; value: string; hint?: string }>) {
  return (
    <div className="rounded-surface bg-surface-subtle p-4">
      <dt className="text-sm text-foreground-muted">{label}</dt>
      <dd className="mt-1 inline-flex items-center gap-2 text-xl font-semibold text-foreground">
        {label === "Учебное время" && <Clock3 size={16} />}
        {value}
      </dd>
      {hint && <p className="mt-1 text-xs text-foreground-subtle">{hint}</p>}
    </div>
  );
}

function TopicList({
  title,
  topics,
}: Readonly<{
  title: string;
  topics?: Array<{ id?: string; title?: string }>;
}>) {
  return (
    <section className="rounded-surface border border-border p-4">
      <h3 className="font-semibold text-foreground">{title}</h3>
      {topics?.length ? (
        <ul className="mt-3 space-y-2">
          {topics.map((topic, index) => (
            <li
              className="rounded-surface bg-surface-subtle px-3 py-2 text-sm text-foreground-muted"
              key={topic.id ?? index}
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
