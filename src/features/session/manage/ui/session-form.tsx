"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  attendancePresentation,
  type AttendanceStatus,
  isoToLocalDateTime,
  type LessonSessionDetails,
  localDateTimeToIso,
} from "@/entities/session";
import { programStatusLabels, studentProgramQueries } from "@/entities/student-program";
import { ApiClientError } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";

import { useCreateSessionMutation, useUpdateSessionMutation } from "../api/session-mutations";

type Props = { studentId: string; session?: LessonSessionDetails };

function defaultLocalDateTime(): string {
  const date = new Date();
  date.setSeconds(0, 0);
  return isoToLocalDateTime(date.toISOString());
}

export function SessionForm({ studentId, session }: Readonly<Props>) {
  const router = useRouter();
  const programs = useQuery(studentProgramQueries.list(studentId));
  const [studentProgramId, setStudentProgramId] = useState(session?.studentProgramId ?? "");
  const effectiveProgramId = studentProgramId || (!session && programs.data?.length === 1 ? programs.data[0].id : "");
  const program = useQuery({
    ...studentProgramQueries.detail(studentId, effectiveProgramId),
    enabled: Boolean(effectiveProgramId),
  });
  const [startedAt, setStartedAt] = useState(session ? isoToLocalDateTime(session.startedAt) : defaultLocalDateTime);
  const [duration, setDuration] = useState(String(session?.durationMinutes ?? 60));
  const [attendance, setAttendance] = useState<AttendanceStatus>(session?.attendanceStatus ?? "ATTENDED");
  const [summary, setSummary] = useState(session?.summary ?? "");
  const [privateNotes, setPrivateNotes] = useState(session?.privateNotes ?? "");
  const [selectedTopics, setSelectedTopics] = useState<string[]>(session?.topics.map((topic) => topic.topicId) ?? []);
  const [primaryTopicId, setPrimaryTopicId] = useState(session?.topics.find((topic) => topic.isPrimary)?.topicId ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const createMutation = useCreateSessionMutation(studentId);
  const updateMutation = useUpdateSessionMutation(studentId, session?.id ?? "new");
  const mutation = session ? updateMutation : createMutation;

  const changeProgram = (nextId: string) => {
    setStudentProgramId(nextId);
    setSelectedTopics([]);
    setPrimaryTopicId("");
    setErrors((current) => ({ ...current, studentProgramId: "" }));
  };

  const toggleTopic = (topicId: string, checked: boolean) => {
    setSelectedTopics((current) => (checked ? [...current, topicId] : current.filter((id) => id !== topicId)));
    if (!checked && primaryTopicId === topicId) setPrimaryTopicId("");
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (mutation.isPending) return;
    const nextErrors: Record<string, string> = {};
    if (!effectiveProgramId) nextErrors.studentProgramId = "Выберите программу";
    const minutes = Number(duration);
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 600)
      nextErrors.duration = "Введите целое число от 1 до 600";
    let startedAtIso = "";
    try {
      startedAtIso = localDateTimeToIso(startedAt);
    } catch {
      nextErrors.startedAt = "Укажите корректные дату и время";
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const common = {
      startedAt: startedAtIso,
      durationMinutes: minutes,
      attendanceStatus: attendance,
      summary: summary.trim() || undefined,
      privateNotes: privateNotes.trim() || undefined,
      topics: selectedTopics.map((topicId) => ({ topicId, isPrimary: topicId === primaryTopicId })),
    };

    try {
      const saved = session
        ? await updateMutation.mutateAsync({ ...common, version: session.version })
        : await createMutation.mutateAsync({ ...common, studentProgramId: effectiveProgramId });
      router.push(`/teacher/students/${studentId}/sessions/${saved.id}`);
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 409) {
        setErrors({ server: "Занятие было изменено. Обновите данные и повторите.", conflict: "true" });
      } else if (error instanceof ApiClientError && error.status === 404) {
        setErrors({ server: "Данные ученика, программы или темы устарели. Обновите страницу и повторите." });
        void programs.refetch();
        if (effectiveProgramId) void program.refetch();
      } else if (error instanceof ApiClientError && error.status === 400) {
        const fieldErrors = Object.fromEntries(error.body.details.map((detail) => [detail.field, detail.message]));
        setErrors({ ...fieldErrors, server: "Проверьте заполненные данные." });
      } else {
        setErrors({ server: "Не удалось сохранить занятие. Попробуйте ещё раз." });
      }
    }
  };

  if (programs.isPending) return <p aria-busy="true">Загружаем программы…</p>;
  if (programs.isError)
    return (
      <div role="alert">
        <p>Не удалось загрузить программы ученика.</p>
        <Button type="button" onClick={() => programs.refetch()}>
          Повторить
        </Button>
      </div>
    );
  if (programs.data.length === 0)
    return (
      <div className="space-y-4 rounded-lg border border-dashed border-neutral-300 p-8 text-center">
        <p className="font-medium">Сначала назначьте ученику программу обучения</p>
        <a className="inline-block underline underline-offset-4" href={`/teacher/students/${studentId}/program`}>
          Перейти в раздел «Программа»
        </a>
      </div>
    );

  return (
    <form className="space-y-7 rounded-lg border border-neutral-200 bg-white p-6" onSubmit={submit} noValidate>
      <div className="space-y-2">
        <label className="block text-sm font-medium" htmlFor="session-program">
          Программа обучения
        </label>
        <select
          id="session-program"
          className="h-11 w-full rounded-md border border-neutral-300 bg-white px-3"
          value={effectiveProgramId}
          disabled={Boolean(session)}
          onChange={(event) => changeProgram(event.target.value)}
        >
          <option value="">Выберите программу</option>
          {programs.data.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title} · {item.subject.name} · {programStatusLabels[item.status]}
            </option>
          ))}
        </select>
        {session && <p className="text-xs text-neutral-500">Программу существующего занятия изменить нельзя.</p>}
        {errors.studentProgramId && <p className="text-sm text-red-700">{errors.studentProgramId}</p>}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-sm font-medium" htmlFor="session-started-at">
            Дата и время
          </label>
          <input
            id="session-started-at"
            className="h-11 w-full rounded-md border border-neutral-300 px-3"
            type="datetime-local"
            value={startedAt}
            onChange={(event) => setStartedAt(event.target.value)}
          />
          <p className="text-xs text-neutral-500">Время указано в вашем часовом поясе.</p>
          {errors.startedAt && <p className="text-sm text-red-700">{errors.startedAt}</p>}
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium" htmlFor="session-duration">
            Длительность, минут
          </label>
          <input
            id="session-duration"
            className="h-11 w-full rounded-md border border-neutral-300 px-3"
            type="number"
            min="1"
            max="600"
            step="1"
            list="duration-presets"
            value={duration}
            onChange={(event) => setDuration(event.target.value)}
          />
          <datalist id="duration-presets">
            <option value="45" />
            <option value="60" />
            <option value="90" />
            <option value="120" />
          </datalist>
          {errors.duration && <p className="text-sm text-red-700">{errors.duration}</p>}
        </div>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Посещаемость</legend>
        <div className="flex flex-wrap gap-3">
          {(Object.keys(attendancePresentation) as AttendanceStatus[]).map((status) => (
            <label
              key={status}
              className="flex cursor-pointer items-center gap-2 rounded-md border border-neutral-300 px-4 py-3 has-[:checked]:border-neutral-900 has-[:checked]:bg-neutral-50"
            >
              <input
                type="radio"
                name="attendance"
                checked={attendance === status}
                onChange={() => setAttendance(status)}
              />
              <span aria-hidden="true">{attendancePresentation[status].icon}</span>
              {attendancePresentation[status].label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-medium">Пройденные темы</legend>
        {!effectiveProgramId && <p className="text-sm text-neutral-600">Сначала выберите программу.</p>}
        {effectiveProgramId && program.isPending && <p aria-busy="true">Загружаем темы…</p>}
        {program.isError && (
          <div role="alert">
            <p>Не удалось загрузить темы программы.</p>
            <Button type="button" onClick={() => program.refetch()}>
              Повторить
            </Button>
          </div>
        )}
        {program.data?.modules.map((module) => (
          <section key={module.id} className="rounded-lg border border-neutral-200">
            <h3 className="border-b border-neutral-200 px-4 py-3 font-medium">{module.title}</h3>
            {module.topics.length === 0 ? (
              <p className="px-4 py-3 text-sm text-neutral-500">В модуле нет тем.</p>
            ) : (
              <div className="divide-y divide-neutral-100">
                {module.topics.map((topic) => {
                  const selected = selectedTopics.includes(topic.id);
                  return (
                    <div key={topic.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={(event) => toggleTopic(topic.id, event.target.checked)}
                        />
                        <span>{topic.title}</span>
                      </label>
                      <label className={`flex items-center gap-2 text-sm ${selected ? "" : "text-neutral-400"}`}>
                        <input
                          type="radio"
                          name="primaryTopic"
                          disabled={!selected}
                          checked={primaryTopicId === topic.id}
                          onChange={() => setPrimaryTopicId(topic.id)}
                        />
                        Основная тема
                      </label>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        ))}
      </fieldset>

      <div className="space-y-2">
        <label className="block text-sm font-medium" htmlFor="session-summary">
          Краткое описание занятия
        </label>
        <textarea
          id="session-summary"
          className="min-h-28 w-full rounded-md border border-neutral-300 p-3"
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium" htmlFor="session-private-notes">
          Личные заметки
        </label>
        <textarea
          id="session-private-notes"
          className="min-h-28 w-full rounded-md border border-neutral-300 p-3"
          value={privateNotes}
          onChange={(event) => setPrivateNotes(event.target.value)}
        />
        <p className="text-xs text-neutral-500">Не показываются ученику или родителю.</p>
      </div>
      {errors.server && (
        <div className="space-y-2" role="alert">
          <p className="text-sm text-red-700">{errors.server}</p>
          {errors.conflict && (
            <button
              className="text-sm font-medium underline underline-offset-4"
              type="button"
              onClick={() => window.location.reload()}
            >
              Обновить данные
            </button>
          )}
        </div>
      )}
      <div className="flex gap-3">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Сохраняем…" : session ? "Сохранить изменения" : "Создать занятие"}
        </Button>
        <Button variant="secondary" type="button" onClick={() => router.back()}>
          Отмена
        </Button>
      </div>
    </form>
  );
}
