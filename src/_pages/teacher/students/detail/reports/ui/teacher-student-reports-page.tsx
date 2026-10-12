import { TeacherStudentReportsView } from "./teacher-student-reports-view";

type Props = {
  params: Promise<{ studentId: string }>;
  searchParams: Promise<{ studentProgramId?: string; learningPeriodId?: string }>;
};

export async function TeacherStudentReportsPage({ params, searchParams }: Readonly<Props>) {
  const { studentId } = await params;
  const { studentProgramId, learningPeriodId } = await searchParams;
  return (
    <TeacherStudentReportsView
      studentId={studentId}
      initialProgramId={studentProgramId}
      learningPeriodId={learningPeriodId}
    />
  );
}
