import { TeacherStudentReportsView } from "./teacher-student-reports-view";

type Props = { params: Promise<{ studentId: string }> };

export async function TeacherStudentReportsPage({ params }: Readonly<Props>) {
  const { studentId } = await params;
  return <TeacherStudentReportsView studentId={studentId} />;
}
