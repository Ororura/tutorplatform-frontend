"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, BookOpenText } from "lucide-react";
import Link from "next/link";

import { MaterialRenderer, SafeMarkdown } from "@/entities/material";
import { studentProgramQueries } from "@/entities/student-program";
import { ApiClientError } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";

type Props = { studentProgramId: string; topicId: string };

function errorStatus(error: unknown): number | undefined {
  return error instanceof ApiClientError ? error.status : (error as { status?: number } | null)?.status;
}

function unavailableStudentDownload(): undefined {
  return undefined;
}

export function StudentProgramTopicView({ studentProgramId, topicId }: Readonly<Props>) {
  const topic = useQuery(studentProgramQueries.currentTopic(studentProgramId, topicId));
  const program = useQuery(studentProgramQueries.currentDetail(studentProgramId));

  if (topic.isPending || program.isPending) {
    return (
      <main>
        <p
          className="rounded-[28px] border border-white/80 bg-white p-6 text-sm text-slate-500 shadow-[0_12px_40px_rgba(45,79,135,0.06)]"
          aria-busy="true"
        >
          Загружаем тему…
        </p>
      </main>
    );
  }

  if (topic.isError || program.isError) {
    const status = errorStatus(topic.error) ?? errorStatus(program.error);
    const title =
      status === 403 ? "Нет доступа к теме" : status === 404 ? "Тема не найдена" : "Не удалось загрузить тему";

    return (
      <main className="space-y-4">
        <section className="space-y-3 rounded-[28px] border border-red-100 bg-red-50 p-6" role="alert">
          <h1 className="text-xl font-semibold text-slate-950">{title}</h1>
          <p className="text-sm leading-6 text-red-700">
            {status === 403
              ? "Эта тема недоступна для вашей учётной записи."
              : status === 404
                ? "Возможно, тема больше не входит в назначенную программу или ссылка устарела."
                : "Попробуйте повторить запрос."}
          </p>
          {status !== 403 && status !== 404 && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                void topic.refetch();
                void program.refetch();
              }}
            >
              Повторить
            </Button>
          )}
        </section>
        <Link
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600"
          href={`/student/programs/${studentProgramId}`}
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Вернуться к программе
        </Link>
      </main>
    );
  }

  const topics = program.data.modules.flatMap((module) => module.topics);
  const topicIndex = topics.findIndex((item) => item.id === topic.data.id);
  const previousTopic = topicIndex > 0 ? topics[topicIndex - 1] : undefined;
  const nextTopic = topicIndex >= 0 ? topics[topicIndex + 1] : undefined;

  return (
    <main className="space-y-4">
      <section className="rounded-[28px] border border-white/80 bg-white p-6 shadow-[0_12px_40px_rgba(45,79,135,0.06)] sm:p-7">
        <nav aria-label="Хлебные крошки">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
            <li>
              <Link className="transition hover:text-blue-600" href="/student/programs">
                Мои программы
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link className="transition hover:text-blue-600" href={`/student/programs/${studentProgramId}`}>
                {program.data.title}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>{topic.data.moduleTitle}</li>
            <li aria-hidden="true">/</li>
            <li className="font-medium text-slate-700" aria-current="page">
              {topic.data.title}
            </li>
          </ol>
        </nav>

        <div className="mt-6 flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <BookOpenText size={22} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-blue-600">{topic.data.moduleTitle}</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">{topic.data.title}</h1>
            <div className="mt-4 text-sm text-slate-600">
              {topic.data.description ? (
                <SafeMarkdown>{topic.data.description}</SafeMarkdown>
              ) : (
                <p>Описание темы пока не добавлено.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section
        className="rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_12px_40px_rgba(45,79,135,0.06)] sm:p-6"
        aria-labelledby="topic-materials-heading"
      >
        <h2 className="text-xl font-semibold text-slate-950" id="topic-materials-heading">
          Учебные материалы
        </h2>

        {topic.data.materials.length === 0 ? (
          <p className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center text-sm text-slate-500">
            Для этой темы пока нет материалов.
          </p>
        ) : (
          <ol className="mt-5 space-y-4">
            {topic.data.materials.map((material) => (
              <li className="rounded-[22px] border border-slate-200/80 p-5" key={material.id}>
                <h3 className="mb-3 font-semibold text-slate-950">{material.title}</h3>
                <div className="text-sm text-slate-700">
                  <MaterialRenderer material={material} getDownloadUrl={unavailableStudentDownload} />
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <nav
        className="grid gap-3 rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_12px_40px_rgba(45,79,135,0.06)] sm:grid-cols-2 sm:p-6"
        aria-label="Навигация по темам"
      >
        {previousTopic ? (
          <Link
            className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 transition hover:border-blue-200 hover:bg-blue-50/40"
            href={`/student/programs/${studentProgramId}/topics/${previousTopic.id}`}
          >
            <ArrowLeft className="shrink-0 text-blue-600" size={18} aria-hidden="true" />
            <span className="min-w-0">
              <span className="block text-xs text-slate-500">Предыдущая тема</span>
              <span className="mt-1 block truncate font-medium text-slate-900">{previousTopic.title}</span>
            </span>
          </Link>
        ) : (
          <p className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-400">
            Предыдущей темы нет
          </p>
        )}

        {nextTopic ? (
          <Link
            className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 p-4 text-right transition hover:border-blue-200 hover:bg-blue-50/40"
            href={`/student/programs/${studentProgramId}/topics/${nextTopic.id}`}
          >
            <span className="min-w-0">
              <span className="block text-xs text-slate-500">Следующая тема</span>
              <span className="mt-1 block truncate font-medium text-slate-900">{nextTopic.title}</span>
            </span>
            <ArrowRight className="shrink-0 text-blue-600" size={18} aria-hidden="true" />
          </Link>
        ) : (
          <p className="rounded-2xl border border-dashed border-slate-200 p-4 text-right text-sm text-slate-400">
            Следующей темы нет
          </p>
        )}
      </nav>
    </main>
  );
}
