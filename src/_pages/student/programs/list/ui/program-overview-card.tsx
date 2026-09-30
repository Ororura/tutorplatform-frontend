import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { progressQueries } from "@/entities/progress";
import {
  ProgramIcon,
  ProgramStatusBadge,
  ProgramTopicProgress,
  studentProgramHref,
  studentProgramQueries,
  type StudentProgramSummary,
} from "@/entities/student-program";
import { buttonClassName } from "@/shared/ui/button";

export function ProgramOverviewCard({
  program,
  active,
}: Readonly<{ program: StudentProgramSummary; active: boolean }>) {
  const progress = useQuery(progressQueries.currentStudent(program.id));
  const details = useQuery({ ...studentProgramQueries.currentDetail(program.id), enabled: active });
  const modules = details.isError ? undefined : details.data?.modules;
  // Only the explicit IN_PROGRESS state identifies a current topic.
  const currentTopics = modules?.flatMap((module) =>
    module.topics.filter((topic) => topic.progressStatus === "IN_PROGRESS").map((topic) => ({ topic, module })),
  );
  const current = currentTopics?.length === 1 ? currentTopics[0] : undefined;
  const programHref = studentProgramHref(program.id);

  if (!active) {
    return (
      <article aria-label={program.title} className="min-w-0 rounded-2xl border border-(--border) bg-white p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <ProgramIcon />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="wrap-break-word text-xs text-slate-500">{program.subject.name}</p>
              <ProgramStatusBadge status={program.status} />
            </div>
            <h3 className="mt-2 wrap-break-word text-base font-semibold tracking-tight text-slate-950">
              {program.title}
            </h3>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-end gap-x-5 gap-y-3">
          {!progress.isError && progress.data && (
            <div className="min-w-0 flex-1 basis-40">
              <ProgramTopicProgress progress={progress.data} title={program.title} compact />
            </div>
          )}
          <Link
            href={programHref}
            aria-label={`Открыть: ${program.title}`}
            className="ml-auto inline-flex min-h-10 items-center gap-2 rounded-xl px-2 text-sm font-medium text-blue-600 transition hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Открыть <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </article>
    );
  }

  return (
    <article
      aria-label={program.title}
      className="grid min-w-0 gap-6 rounded-2xl border border-(--border) bg-white p-5 shadow-xs sm:p-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)] xl:gap-8 xl:p-7"
    >
      <div className="flex min-w-0 flex-col justify-between gap-6">
        <div className="flex items-start gap-4">
          <ProgramIcon large />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="wrap-break-word text-sm text-slate-500">{program.subject.name}</p>
              <ProgramStatusBadge status={program.status} />
            </div>
            <h3 className="mt-2 wrap-break-word text-2xl font-semibold tracking-tight text-slate-950 xl:text-3xl">
              {program.title}
            </h3>
            {program.description && (
              <p className="mt-3 line-clamp-3 wrap-break-word text-sm leading-6 text-slate-500 sm:text-base">
                {program.description}
              </p>
            )}
          </div>
        </div>
        {current && (
          <div className="min-w-0">
            <p className="text-sm font-medium text-blue-600">Текущая тема</p>
            <h4 className="mt-1 wrap-break-word text-lg font-semibold text-slate-950">{current.topic.title}</h4>
            <p className="mt-1 wrap-break-word text-sm text-slate-500">{current.module.title}</p>
          </div>
        )}
        {!progress.isError && <ProgramTopicProgress progress={progress.data} title={program.title} />}
      </div>
      <div className="flex min-w-0 items-center justify-center">
        <Link
          href={current ? studentProgramHref(program.id, current.topic.id) : programHref}
          className={buttonClassName(
            "primary",
            "h-auto min-h-14 w-full gap-3 rounded-2xl px-6 py-4 text-center text-base lg:min-h-20 lg:max-w-72 lg:rounded-3xl lg:text-lg xl:min-h-20 xl:max-w-80",
          )}
        >
          {current ? "Продолжить обучение" : "Открыть программу"}
          <ArrowRight size={19} className="shrink-0" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
