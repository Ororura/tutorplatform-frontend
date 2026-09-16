import { Suspense } from "react";

import { TeacherStudentSessionsView } from "./teacher-student-sessions-view";

export async function TeacherStudentSessionsPage({ params }: Readonly<{ params: Promise<{ studentId: string }> }>) {
  const { studentId } = await params;
  return (
    <Suspense
      fallback={
        <p className="mx-auto max-w-5xl px-6 py-12" aria-busy="true">
          Загружаем занятия…
        </p>
      }
    >
      <TeacherStudentSessionsView studentId={studentId} />
    </Suspense>
  );
}
