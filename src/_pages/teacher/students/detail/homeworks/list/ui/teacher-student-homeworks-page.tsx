import { Suspense } from "react";

import { TeacherStudentHomeworksView } from "./teacher-student-homeworks-view";

export async function TeacherStudentHomeworksPage({ params }: Readonly<{ params: Promise<{ studentId: string }> }>) {
  const { studentId } = await params;
  return (
    <Suspense
      fallback={
        <p className="mx-auto max-w-5xl px-6 py-12" aria-busy="true">
          Загружаем домашние задания…
        </p>
      }
    >
      <TeacherStudentHomeworksView studentId={studentId} />
    </Suspense>
  );
}
