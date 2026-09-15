import Link from "next/link";

import { HomeworkForm } from "@/features/homework/create";

export async function TeacherStudentHomeworkNewPage({ params }: Readonly<{ params: Promise<{ studentId: string }> }>) {
  const { studentId } = await params;
  return <main className="mx-auto max-w-4xl space-y-8 px-6 py-12"><div><Link className="text-sm text-neutral-600 underline" href={`/teacher/students/${studentId}/homework`}>← Домашние задания</Link><h1 className="mt-4 text-3xl font-semibold">Назначить домашнее задание</h1></div><HomeworkForm studentId={studentId} /></main>;
}
