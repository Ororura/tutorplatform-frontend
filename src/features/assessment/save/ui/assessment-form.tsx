"use client";

import { useState } from "react";

import type { TeacherAssessment } from "@/entities/assessment";
import { ApiClientError } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";

import { type SaveTeacherAssessmentRequest, useSaveAssessmentMutation } from "../api/save-assessment";

type ScoreField = "understandingScore" | "independenceScore" | "practiceScore" | "homeworkScore";

const scoreFields: ReadonlyArray<[ScoreField, string]> = [
  ["understandingScore", "Понимание материала"],
  ["independenceScore", "Самостоятельность"],
  ["practiceScore", "Практика"],
  ["homeworkScore", "Домашняя работа"],
];

type FormValues = Record<ScoreField, string> & { publicComment: string };

function initialValues(assessment?: TeacherAssessment): FormValues {
  return {
    understandingScore: assessment?.understandingScore?.toString() ?? "",
    independenceScore: assessment?.independenceScore?.toString() ?? "",
    practiceScore: assessment?.practiceScore?.toString() ?? "",
    homeworkScore: assessment?.homeworkScore?.toString() ?? "",
    publicComment: assessment?.publicComment ?? "",
  };
}

function saveErrorMessage(error: unknown): string {
  if (!(error instanceof ApiClientError)) return "Не удалось сохранить оценку. Попробуйте ещё раз.";
  if (error.status === 404) return "Занятие больше недоступно. Обновите страницу.";
  if (error.status === 409) return "Оценка была изменена. Обновите страницу и повторите попытку.";
  if (error.status === 400) return "Проверьте заполненные значения.";
  return "Не удалось сохранить оценку. Попробуйте ещё раз.";
}

export function AssessmentForm({
  studentId,
  sessionId,
  assessment,
  onCancel,
  onSaved,
}: Readonly<{
  studentId: string;
  sessionId: string;
  assessment?: TeacherAssessment;
  onCancel?: () => void;
  onSaved: (assessment: TeacherAssessment) => void;
}>) {
  const [values, setValues] = useState(() => initialValues(assessment));
  const [errors, setErrors] = useState<Partial<Record<ScoreField | "server", string>>>({});
  const save = useSaveAssessmentMutation(studentId, sessionId);

  const submit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (save.isPending) return;

    const nextErrors: Partial<Record<ScoreField, string>> = {};
    const body: SaveTeacherAssessmentRequest = { publicComment: values.publicComment.trim() || null };
    for (const [field] of scoreFields) {
      const raw = values[field];
      if (raw === "") {
        body[field] = null;
        continue;
      }
      const score = Number(raw);
      if (!Number.isInteger(score) || score < 1 || score > 5) {
        nextErrors[field] = "Укажите целое число от 1 до 5";
      } else {
        body[field] = score;
      }
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    try {
      onSaved(await save.mutateAsync(body));
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 400) {
        const fieldErrors = Object.fromEntries(
          error.body.details
            .filter((detail) => scoreFields.some(([field]) => field === detail.field))
            .map((detail) => [detail.field, "Укажите целое число от 1 до 5"]),
        );
        setErrors({ server: saveErrorMessage(error), ...fieldErrors });
      } else {
        setErrors({ server: saveErrorMessage(error) });
      }
    }
  };

  return (
    <form className="space-y-5" onSubmit={submit} noValidate>
      <p className="text-sm text-neutral-600">Все поля необязательны. Оценки выставляются по шкале от 1 до 5.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {scoreFields.map(([field, label]) => (
          <label className="block space-y-2" key={field}>
            <span className="text-sm font-medium">{label}</span>
            <input
              aria-describedby={errors[field] ? `${field}-error` : undefined}
              aria-invalid={Boolean(errors[field])}
              className="h-11 w-full rounded-md border border-neutral-300 px-3"
              inputMode="numeric"
              max={5}
              min={1}
              step={1}
              type="number"
              value={values[field]}
              onChange={(event) => {
                setValues((current) => ({ ...current, [field]: event.target.value }));
                setErrors((current) => ({ ...current, [field]: undefined, server: undefined }));
              }}
            />
            {errors[field] && (
              <p className="text-sm text-red-700" id={`${field}-error`}>
                {errors[field]}
              </p>
            )}
          </label>
        ))}
      </div>
      <label className="block space-y-2">
        <span className="text-sm font-medium">Комментарий для ученика</span>
        <textarea
          className="min-h-28 w-full rounded-md border border-neutral-300 p-3"
          value={values.publicComment}
          onChange={(event) => {
            setValues((current) => ({ ...current, publicComment: event.target.value }));
            setErrors((current) => ({ ...current, server: undefined }));
          }}
        />
      </label>
      {errors.server && (
        <p className="text-sm text-red-700" role="alert">
          {errors.server}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? "Сохраняем…" : "Сохранить оценку"}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" disabled={save.isPending} onClick={onCancel}>
            Отмена
          </Button>
        )}
      </div>
    </form>
  );
}
