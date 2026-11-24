import { PageBackLink, PageHeader } from "@/shared/ui/page-header";

import { HomeworkForm } from "@/features/homework/create";

export async function TeacherStudentHomeworkNewPage({ params }: Readonly<{ params: Promise<{ studentId: string }> }>) {
  const { studentId } = await params;
  return (
    <main className="page-form page-stack">
      <PageHeader
        title="Назначить домашнее задание"
        navigation={<PageBackLink href={`/teacher/students/${studentId}/homework`}>Домашние задания</PageBackLink>}
      />
      <HomeworkForm studentId={studentId} />
    </main>
  );
}
