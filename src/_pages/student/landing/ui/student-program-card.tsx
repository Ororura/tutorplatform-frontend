import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Check, Circle, Target } from "lucide-react";
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

import { getTopicCompletion } from "../model/dashboard-presentation";

export function StudentProgramCard({
  program,
  primary,
}: Readonly<{ program: StudentProgramSummary; primary: boolean }>) {
  const progress = useQuery(progressQueries.currentStudent(program.id));
  const details = useQuery({
    ...studentProgramQueries.currentDetail(program.id),
    enabled: primary && program.status === "ACTIVE",
  });
  const modules = details.isError ? undefined : details.data?.modules;
  const topics = modules?.flatMap((module) => module.topics);
  // An in-progress topic is current; otherwise show the first available topic as the next step.
  const current =
    topics?.find((topic) => topic.progressStatus === "IN_PROGRESS") ??
    topics?.find((topic) => topic.progressStatus === "AVAILABLE");
  const currentModule = modules?.find((module) => module.topics.some((topic) => topic.id === current?.id));
  const programHref = studentProgramHref(program.id);

  return (
    <article
      aria-label={program.title}
      className="min-w-0 rounded-2xl border border-slate-200 p-4 transition hover:border-blue-200"
    >
      <Link
        href={programHref}
        className="group flex items-start gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      >
        <ProgramIcon />
        <div className="min-w-0 flex-1">
          <h3 className="break-words text-base font-semibold tracking-tight text-slate-950 sm:text-lg">
            {program.title}
          </h3>
          <p className="mt-1 break-words text-sm text-slate-500">{program.subject.name}</p>
        </div>
        <ArrowRight
          size={16}
          className="mt-1 shrink-0 text-blue-600 transition group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </Link>
      <div className="mt-3">
        <ProgramStatusBadge status={program.status} />
      </div>
      {!progress.isError && getTopicCompletion(progress.data) && (
        <div className="mt-4">
          <ProgramTopicProgress progress={progress.data} title={program.title} />
        </div>
      )}
      {primary && current && currentModule && (
        <div className="mt-4 rounded-xl bg-blue-50/60 p-3.5">
          <Link
            href={`${programHref}/topics/${current.id}`}
            className="group flex items-center justify-between gap-3 rounded-lg"
          >
            <div className="min-w-0">
              <p className="text-xs text-slate-500">
                {current.progressStatus === "IN_PROGRESS" ? "Текущая тема" : "Следующая тема"}
              </p>
              <p className="mt-1 break-words font-semibold text-slate-950">{current.title}</p>
              <p className="mt-1 break-words text-xs text-slate-500">{currentModule.title}</p>
            </div>
            <ArrowRight
              size={19}
              className="shrink-0 text-blue-600 transition group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
          <ul className="mt-3 space-y-2 border-t border-blue-100 pt-3">
            {currentModule.topics
              .filter((topic) => topic.progressStatus && topic.progressStatus !== "LOCKED")
              .slice(0, 4)
              .map((topic) => (
                <li key={topic.id}>
                  <Link
                    href={`${programHref}/topics/${topic.id}`}
                    className="flex items-start gap-2 rounded text-xs leading-5 text-slate-600 hover:text-blue-700"
                  >
                    {topic.progressStatus === "COMPLETED" ? (
                      <Check size={17} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden="true" />
                    ) : (
                      <Circle size={17} className="mt-0.5 shrink-0 text-blue-400" aria-hidden="true" />
                    )}
                    <span className="min-w-0 break-words">
                      {topic.title}
                      <span className="sr-only">
                        {topic.progressStatus === "COMPLETED"
                          ? ", пройдена"
                          : topic.progressStatus === "IN_PROGRESS"
                            ? ", в процессе"
                            : ", доступна"}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
          </ul>
        </div>
      )}
      {primary && details.isPending && program.status === "ACTIVE" && (
        <div className="mt-4 h-24 rounded-xl bg-slate-50 motion-safe:animate-pulse" role="status" aria-busy="true">
          <span className="sr-only">Загружаем темы программы…</span>
        </div>
      )}
    </article>
  );
}

export function StudentProgramMotivation({ program }: Readonly<{ program: StudentProgramSummary }>) {
  const progress = useQuery(progressQueries.currentStudent(program.id));
  const completion = progress.isError ? undefined : getTopicCompletion(progress.data);
  if (!completion || completion.completed === 0) return null;
  return (
    <aside className="flex items-start gap-3 rounded-2xl bg-blue-50 p-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-blue-100/60 text-blue-600">
        <Target size={23} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <h3 className="font-semibold text-slate-950">Отличный прогресс!</h3>
        <p className="mt-1 break-words text-xs leading-5 text-slate-600">
          Ты прошёл {completion.percent}% программы «{program.title}». Продолжай в том же духе!
        </p>
      </div>
    </aside>
  );
}
