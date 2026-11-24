import { Suspense } from "react";
import { LoadingState } from "@/shared/ui/feedback";

import { TeacherStudentSessionsView } from "./teacher-student-sessions-view";

export async function TeacherStudentSessionsPage({ params }: Readonly<{ params: Promise<{ studentId: string }> }>) {
  const { studentId } = await params;
  return (
    <Suspense fallback={<LoadingState>Загружаем занятия…</LoadingState>}>
      <TeacherStudentSessionsView studentId={studentId} />
    </Suspense>
  );
}
