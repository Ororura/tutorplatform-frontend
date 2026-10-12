"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { dashboardQueries, getAttentionPresentation } from "@/entities/dashboard";
import { homeworkQueries } from "@/entities/homework";
import { sessionQueries } from "@/entities/session";
import { teacherSubmissionQueries } from "@/entities/submission";
import { Button } from "@/shared/ui/button";

const dateFormatter = new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short" });

export function TeacherStudentContext({ studentId }: Readonly<{ studentId: string }>) {
  const sessions = useQuery(sessionQueries.latestConducted(studentId));
  const homework = useQuery(
    homeworkQueries.list(studentId, { page: 0, size: 1, status: "ASSIGNED", sort: "dueAt,asc" }),
  );
  const submissions = useQuery(
    teacherSubmissionQueries.list(studentId, { page: 0, size: 1, status: "NEEDS_REVIEW", sort: "submittedAt,asc" }),
  );
  const periods = useQuery(
    dashboardQueries.attention({ studentId, type: "LEARNING_PERIOD_REPORT_MISSING", page: 0, size: 1 }),
  );
  const base = `/teacher/students/${studentId}`;
  const lastSession = sessions.data?.items[0];
  const firstSubmission = submissions.data?.items[0];
  const firstPeriod = periods.data?.items[0];
  return (
    <section className="surface" aria-labelledby="student-context-heading">
      <h2 id="student-context-heading" className="section-title">
        Учебная ситуация
      </h2>
      <ul className="mt-3 grid divide-y divide-border">
        <ContextIndicator
          label="Последнее проведённое занятие"
          query={sessions}
          href={lastSession ? `${base}/sessions/${lastSession.id}` : `${base}/sessions`}
          value={lastSession ? dateFormatter.format(new Date(lastSession.startedAt)) : "Проведённых занятий пока нет"}
        />
        <ContextIndicator
          label="Активные домашние задания"
          query={homework}
          href={`${base}/homework?status=ASSIGNED`}
          value={
            homework.data?.totalElements
              ? `${homework.data.totalElements} · ${homework.data.items[0]?.title ?? "Открыть список"}`
              : "Нет активных домашних заданий"
          }
        />
        <ContextIndicator
          label="Работы, ожидающие проверки"
          query={submissions}
          href={firstSubmission ? `${base}/submissions/${firstSubmission.id}` : `${base}/homework`}
          value={
            submissions.data?.totalElements
              ? `${submissions.data.totalElements} · Открыть старейшую работу`
              : "Нет работ на проверку"
          }
        />
        <ContextIndicator
          label="Готовые отчётные периоды"
          query={periods}
          href={firstPeriod ? getAttentionPresentation(firstPeriod).href : `${base}/reports`}
          value={
            periods.data?.totalElements
              ? `${periods.data.totalElements} · Открыть период`
              : "Нет периодов, ожидающих отчёта"
          }
        />
      </ul>
    </section>
  );
}

type IndicatorProps = {
  label: string;
  href: string;
  value: string;
  query: { isPending: boolean; isError: boolean; refetch: () => unknown };
};
function ContextIndicator({ label, href, value, query }: Readonly<IndicatorProps>) {
  return (
    <li className="flex flex-wrap items-start justify-between gap-3 py-3">
      <Link className="min-w-0 flex-1 rounded-control wrap-break-word" href={href}>
        <span className="block text-sm font-medium text-primary">{label}</span>
        {query.isPending ? (
          <span className="mt-1 block text-sm text-foreground-muted" role="status" aria-busy="true">
            Загружаем…
          </span>
        ) : query.isError ? (
          <span className="mt-1 block text-sm text-danger" role="alert">
            Данные недоступны
          </span>
        ) : (
          <span className="mt-1 block text-sm text-foreground">{value}</span>
        )}
      </Link>
      {query.isError && (
        <Button
          type="button"
          variant="secondary"
          aria-label={`Повторить: ${label}`}
          onClick={() => void query.refetch()}
        >
          Повторить
        </Button>
      )}
    </li>
  );
}
