import Link from "next/link";

import { HomeworkForm } from "@/features/homework/create";

export async function TeacherStudentHomeworkNewPage({ params }: Readonly<{ params: Promise<{ studentId: string }> }>) {
  const { studentId } = await params;
  return (
    <main className="page-form page-stack">
      <div>
        <Link className="text-sm text-foreground-muted underline" href={`/teacher/students/${studentId}/homework`}>
          ← Домашние задания
        </Link>
        <h1 className="page-title mt-4">Назначить домашнее задание</h1>
      </div>
      <HomeworkForm studentId={studentId} />
    </main>
  );
}
