import { PageBackLink, PageHeader } from "@/shared/ui/page-header";

import { SessionForm } from "@/features/session/manage";

export async function TeacherStudentSessionNewPage({ params }: Readonly<{ params: Promise<{ studentId: string }> }>) {
  const { studentId } = await params;
  return (
    <main className="page-form page-stack">
      <PageHeader
        title="Добавить занятие"
        navigation={<PageBackLink href={`/teacher/students/${studentId}/sessions`}>Все занятия</PageBackLink>}
      />
      <SessionForm studentId={studentId} />
    </main>
  );
}
