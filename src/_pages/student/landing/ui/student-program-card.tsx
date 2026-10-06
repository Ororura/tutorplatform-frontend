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
    <article aria-label={program.title} className="surface">
      <Link
        href={programHref}
        className="group flex items-start gap-3 rounded-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
      >
        <ProgramIcon />
        <div className="min-w-0 flex-1">
          <h3 className="wrap-break-word text-base font-semibold tracking-tight text-foreground sm:text-lg">
            {program.title}
          </h3>
          <p className="mt-1 wrap-break-word text-sm text-foreground-muted">{program.subject.name}</p>
        </div>
        <ArrowRight
          size={16}
          className="mt-1 shrink-0 text-primary transition group-hover:translate-x-0.5"
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
        <div className="mt-4 border-t border-border pt-4">
          <Link
            href={`${programHref}/topics/${current.id}`}
            className="group flex items-center justify-between gap-3 rounded-inset"
          >
            <div className="min-w-0">
              <p className="text-xs text-foreground-muted">
                {current.progressStatus === "IN_PROGRESS" ? "Текущая тема" : "Следующая тема"}
              </p>
              <p className="mt-1 wrap-break-word font-semibold text-foreground">{current.title}</p>
              <p className="mt-1 wrap-break-word text-xs text-foreground-muted">{currentModule.title}</p>
            </div>
            <ArrowRight
              size={19}
              className="shrink-0 text-primary transition group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
          <ul className="mt-3 space-y-2 border-t border-primary-border pt-3">
            {currentModule.topics
              .filter((topic) => topic.progressStatus && topic.progressStatus !== "LOCKED")
              .slice(0, 4)
              .map((topic) => (
                <li key={topic.id}>
                  <Link
                    href={`${programHref}/topics/${topic.id}`}
                    className="flex items-start gap-2 rounded text-xs leading-5 text-foreground-muted hover:text-primary"
                  >
                    {topic.progressStatus === "COMPLETED" ? (
                      <Check size={17} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
                    ) : (
                      <Circle size={17} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                    )}
                    <span className="min-w-0 wrap-break-word">
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
        <div
          className="mt-4 h-24 rounded-surface bg-surface-subtle motion-safe:animate-pulse"
          role="status"
          aria-busy="true"
        >
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
    <aside className="flex items-start gap-3 rounded-surface bg-primary-subtle p-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-surface bg-primary-subtle/60 text-primary">
        <Target size={23} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <h3 className="font-semibold text-foreground">Отличный прогресс!</h3>
        <p className="mt-1 wrap-break-word text-xs leading-5 text-foreground-muted">
          Ты прошёл {completion.percent}% программы «{program.title}». Продолжай в том же духе!
        </p>
      </div>
    </aside>
  );
}
