import { Input } from "@/shared/ui/form-controls";
import Link from "next/link";

import type { ProgramTopic, StudentProgramDetails } from "../api/student-program-queries";
import { formatProgramDate, programStatusLabels } from "../model/student-program-labels";
import { TopicProgressBadge } from "./topic-progress-badge";

type TopicSelection = {
  enabled: boolean;
  selectedTopicIds: ReadonlySet<string>;
  isSelectable: (topic: ProgramTopic) => boolean;
  onToggle: (topicId: string, checked: boolean) => void;
};

export function StudentProgramDetail({
  program,
  studentId,
  topicSelection,
}: Readonly<{
  program: StudentProgramDetails;
  studentId: string;
  topicSelection?: TopicSelection;
}>) {
  return (
    <>
      <header className="rounded-inset border border-border bg-surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-foreground-muted">{program.subject.name}</p>

            <h1 className="page-title mt-1">{program.title}</h1>

            {program.description && (
              <p className="mt-3 max-w-3xl whitespace-pre-line text-foreground-muted">{program.description}</p>
            )}
          </div>

          <span className="badge bg-surface-subtle">{programStatusLabels[program.status]}</span>
        </div>

        <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-3 text-sm">
          <div>
            <dt className="text-foreground-muted">Начата</dt>

            <dd className="font-medium">{formatProgramDate(program.startedAt)}</dd>
          </div>

          {program.completedAt && (
            <div>
              <dt className="text-foreground-muted">Завершена</dt>

              <dd className="font-medium">{formatProgramDate(program.completedAt)}</dd>
            </div>
          )}

          <div>
            <dt className="text-foreground-muted">Отчётный интервал</dt>

            <dd className="font-medium">{program.reportIntervalMinutes} мин</dd>
          </div>
        </dl>
      </header>

      <section className="space-y-5" aria-labelledby="program-structure-heading">
        <h2 id="program-structure-heading" className="section-title">
          Содержание программы
        </h2>

        {program.modules.length === 0 && (
          <p className="rounded-inset border border-dashed border-border-strong p-6 text-foreground-muted">
            В программе пока нет модулей.
          </p>
        )}

        {program.modules.map((module) => (
          <section className="rounded-inset border border-border bg-surface" key={module.id}>
            <div className="border-b border-border px-5 py-4">
              <h3 className="font-semibold">{module.title}</h3>

              {module.description && <p className="mt-1 text-sm text-foreground-muted">{module.description}</p>}
            </div>

            {module.topics.length === 0 ? (
              <p className="px-5 py-4 text-sm text-foreground-muted">В модуле пока нет тем.</p>
            ) : (
              <ol className="divide-y divide-border">
                {module.topics.map((topic) => {
                  const selectable = topicSelection?.enabled === true && topicSelection.isSelectable(topic);

                  const selected = topicSelection?.selectedTopicIds.has(topic.id) ?? false;

                  return (
                    <li key={topic.id}>
                      <div className="flex items-center gap-3 px-5 py-2">
                        {topicSelection?.enabled && (
                          <Input
                            aria-label={`Выбрать тему «${topic.title}»`}
                            checked={selected}
                            className="size-4 shrink-0 rounded text-primary accent-primary disabled:opacity-40"
                            disabled={!selectable}
                            type="checkbox"
                            onChange={(event) => topicSelection.onToggle(topic.id, event.currentTarget.checked)}
                          />
                        )}

                        <Link
                          className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-3 rounded-inset px-2 py-2 transition hover:bg-surface-subtle"
                          href={`/teacher/students/${studentId}/programs/${program.id}/topics/${topic.id}`}
                        >
                          <span className="min-w-0 font-medium">{topic.title}</span>

                          <TopicProgressBadge status={topic.progressStatus} />
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        ))}
      </section>
    </>
  );
}
