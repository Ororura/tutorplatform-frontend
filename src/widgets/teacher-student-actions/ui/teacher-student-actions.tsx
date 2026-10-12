"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { studentProgramQueries } from "@/entities/student-program";
import { Button, buttonClassName } from "@/shared/ui/button";

export function TeacherStudentActions({ studentId, active }: Readonly<{ studentId: string; active: boolean }>) {
  const programs = useQuery({ ...studentProgramQueries.list(studentId), enabled: active });
  const canCreate = active && programs.isSuccess && programs.data.length > 0;
  const base = `/teacher/students/${studentId}`;
  return (
    <section className="surface" aria-labelledby="student-actions-heading">
      <h2 id="student-actions-heading" className="section-title">
        Быстрые действия с учеником
      </h2>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {canCreate ? (
          <>
            <Link className={buttonClassName()} href={`${base}/sessions/new`}>
              Создать занятие
            </Link>
            <Link className={buttonClassName("secondary")} href={`${base}/homework/new`}>
              Назначить домашнее задание
            </Link>
          </>
        ) : (
          <>
            <Button type="button" disabled aria-describedby="student-actions-availability">
              Создать занятие
            </Button>
            <Button type="button" variant="secondary" disabled aria-describedby="student-actions-availability">
              Назначить домашнее задание
            </Button>
          </>
        )}
        <Link className={buttonClassName("secondary")} href={`${base}/progress`}>
          Открыть прогресс
        </Link>
        <Link className={buttonClassName("secondary")} href={`${base}/reports`}>
          Открыть отчёты
        </Link>
      </div>
      {!canCreate && (
        <div id="student-actions-availability" className="mt-3 text-sm text-foreground-muted">
          {!active ? (
            <p>Создание занятий и домашних заданий недоступно для неактивного ученика.</p>
          ) : programs.isPending ? (
            <p role="status" aria-busy="true">
              Проверяем доступные программы…
            </p>
          ) : programs.isError ? (
            <div role="alert">
              <p>Не удалось проверить доступные программы.</p>
              <Button type="button" className="mt-2" variant="secondary" onClick={() => void programs.refetch()}>
                Повторить
              </Button>
            </div>
          ) : (
            <p>
              Сначала{" "}
              <Link className="text-primary underline" href={`${base}/program`}>
                назначьте программу обучения
              </Link>
              .
            </p>
          )}
        </div>
      )}
    </section>
  );
}
