"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { StudentProgramDetail, studentProgramQueries } from "@/entities/student-program";
import { AssignLearningProgramDialog } from "@/features/program/assign";
import { ApiClientError } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";

export function TeacherStudentProgramDetailView({
  studentId,
  studentProgramId,
}: Readonly<{ studentId: string; studentProgramId: string }>) {
  const program = useQuery(studentProgramQueries.detail(studentId, studentProgramId));
  const router = useRouter();

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-6 py-12">
      <Link className="text-sm text-neutral-600 underline underline-offset-4" href={`/teacher/students/${studentId}/program`}>← Программы ученика</Link>
      {program.isPending && <p className="rounded-lg border border-neutral-200 bg-white p-5 text-neutral-600" aria-busy="true">Загружаем программу…</p>}
      {program.isError && (
        <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-5" role="alert">
          <h1 className="text-2xl font-semibold">{program.error instanceof ApiClientError && program.error.status === 404 ? "Программа не найдена" : "Не удалось загрузить программу."}</h1>
          {!(program.error instanceof ApiClientError && program.error.status === 404) && <Button type="button" onClick={() => program.refetch()}>Повторить</Button>}
        </div>
      )}
      {program.data && (
        <>
          <div className="flex justify-end">
            <AssignLearningProgramDialog
              studentId={studentId}
              triggerLabel="Назначить ещё программу"
              onAssigned={(created) => router.push(`/teacher/students/${studentId}/programs/${created.id}`)}
            />
          </div>
          <StudentProgramDetail program={program.data} studentId={studentId} />
        </>
      )}
    </main>
  );
}
