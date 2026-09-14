"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { StudentProfileNav } from "@/entities/student";
import { StudentProgramList, studentProgramQueries } from "@/entities/student-program";
import { ApiClientError } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";

export function TeacherStudentProgramView({ studentId }: Readonly<{ studentId: string }>) {
  const programs = useQuery(studentProgramQueries.list(studentId));
  const router = useRouter();

  useEffect(() => {
    if (programs.data?.length === 1) {
      router.replace(`/teacher/students/${studentId}/programs/${programs.data[0].id}`);
    }
  }, [programs.data, router, studentId]);

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-6 py-12">
      <div>
        <Link className="text-sm text-neutral-600 underline underline-offset-4" href={`/teacher/students/${studentId}`}>← Профиль ученика</Link>
        <h1 className="mt-4 text-3xl font-semibold">Программа обучения</h1>
      </div>
      <StudentProfileNav active="program" studentId={studentId} />

      {programs.isPending && <p className="rounded-lg border border-neutral-200 bg-white p-5 text-neutral-600" aria-busy="true">Загружаем программы…</p>}
      {programs.isError && (
        <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-5" role="alert">
          <p>{programs.error instanceof ApiClientError && programs.error.status === 404 ? "Ученик не найден" : "Не удалось загрузить программы ученика."}</p>
          {!(programs.error instanceof ApiClientError && programs.error.status === 404) && <Button type="button" onClick={() => programs.refetch()}>Повторить</Button>}
        </div>
      )}
      {programs.data?.length === 0 && (
        <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center">
          <p className="font-medium">У ученика пока нет программы обучения</p>
        </div>
      )}
      {programs.data?.length === 1 && <p aria-busy="true">Открываем программу…</p>}
      {programs.data && programs.data.length > 1 && (
        <section className="space-y-4" aria-labelledby="program-selection-heading">
          <h2 className="text-xl font-semibold" id="program-selection-heading">Выберите программу</h2>
          <StudentProgramList programs={programs.data} studentId={studentId} />
        </section>
      )}
    </main>
  );
}
