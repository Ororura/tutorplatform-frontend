import Link from "next/link";

import { SessionForm } from "@/features/session/manage";

export async function TeacherStudentSessionNewPage({ params }: Readonly<{ params: Promise<{ studentId: string }> }>) {
  const { studentId } = await params;
  return (
    <main className="mx-auto max-w-3xl space-y-8 px-6 py-12">
      <div>
        <Link
          className="text-sm text-neutral-600 underline underline-offset-4"
          href={`/teacher/students/${studentId}/sessions`}
        >
          ← Все занятия
        </Link>
        <h1 className="mt-4 text-3xl font-semibold">Добавить занятие</h1>
      </div>
      <SessionForm studentId={studentId} />
    </main>
  );
}
