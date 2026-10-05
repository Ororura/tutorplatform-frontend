import Link from "next/link";

import { SessionForm } from "@/features/session/manage";

export async function TeacherStudentSessionNewPage({ params }: Readonly<{ params: Promise<{ studentId: string }> }>) {
  const { studentId } = await params;
  return (
    <main className="page-form page-stack">
      <div>
        <Link
          className="text-sm text-foreground-muted underline underline-offset-4"
          href={`/teacher/students/${studentId}/sessions`}
        >
          ← Все занятия
        </Link>
        <h1 className="page-title mt-4">Добавить занятие</h1>
      </div>
      <SessionForm studentId={studentId} />
    </main>
  );
}
