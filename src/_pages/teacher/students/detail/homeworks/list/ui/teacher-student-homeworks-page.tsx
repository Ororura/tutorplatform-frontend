import { Suspense } from "react";
import { LoadingState } from "@/shared/ui/feedback";

import { TeacherStudentHomeworksView } from "./teacher-student-homeworks-view";

export async function TeacherStudentHomeworksPage({ params }: Readonly<{ params: Promise<{ studentId: string }> }>) {
  const { studentId } = await params;
  return (
    <Suspense fallback={<LoadingState>Загружаем домашние задания…</LoadingState>}>
      <TeacherStudentHomeworksView studentId={studentId} />
    </Suspense>
  );
}
