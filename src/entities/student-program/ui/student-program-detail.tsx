import Link from "next/link";

import type { StudentProgramDetails } from "../api/student-program-queries";
import { formatProgramDate, programStatusLabels } from "../model/student-program-labels";
import { TopicProgressBadge } from "./topic-progress-badge";

export function StudentProgramDetail({
  program,
  studentId,
}: Readonly<{ program: StudentProgramDetails; studentId: string }>) {
  return (
    <>
      <header className="rounded-lg border border-neutral-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-neutral-600">{program.subject.name}</p>
            <h1 className="mt-1 text-3xl font-semibold">{program.title}</h1>
            {program.description && (
              <p className="mt-3 max-w-3xl whitespace-pre-line text-neutral-700">{program.description}</p>
            )}
          </div>
          <span className="rounded-full bg-neutral-100 px-3 py-1 text-sm font-medium">
            {programStatusLabels[program.status]}
          </span>
        </div>
        <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-3 text-sm">
          <div>
            <dt className="text-neutral-500">Начата</dt>
            <dd className="font-medium">{formatProgramDate(program.startedAt)}</dd>
          </div>
          {program.completedAt && (
            <div>
              <dt className="text-neutral-500">Завершена</dt>
              <dd className="font-medium">{formatProgramDate(program.completedAt)}</dd>
            </div>
          )}
          <div>
            <dt className="text-neutral-500">Отчётный интервал</dt>
            <dd className="font-medium">{program.reportIntervalMinutes} мин</dd>
          </div>
        </dl>
      </header>

      <section className="space-y-5" aria-labelledby="program-structure-heading">
        <h2 id="program-structure-heading" className="text-xl font-semibold">
          Содержание программы
        </h2>
        {program.modules.length === 0 && (
          <p className="rounded-lg border border-dashed border-neutral-300 p-6 text-neutral-600">
            В программе пока нет модулей.
          </p>
        )}
        {program.modules.map((module) => (
          <section className="rounded-lg border border-neutral-200 bg-white" key={module.id}>
            <div className="border-b border-neutral-200 px-5 py-4">
              <h3 className="font-semibold">{module.title}</h3>
              {module.description && <p className="mt-1 text-sm text-neutral-600">{module.description}</p>}
            </div>
            {module.topics.length === 0 ? (
              <p className="px-5 py-4 text-sm text-neutral-500">В модуле пока нет тем.</p>
            ) : (
              <ol className="divide-y divide-neutral-100">
                {module.topics.map((topic) => (
                  <li key={topic.id}>
                    <Link
                      className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition hover:bg-neutral-50"
                      href={`/teacher/students/${studentId}/programs/${program.id}/topics/${topic.id}`}
                    >
                      <span className="font-medium">{topic.title}</span>
                      <TopicProgressBadge status={topic.progressStatus} />
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </section>
        ))}
      </section>
    </>
  );
}
