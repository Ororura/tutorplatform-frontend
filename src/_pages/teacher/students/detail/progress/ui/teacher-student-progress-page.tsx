import { TeacherStudentProgressView } from "./teacher-student-progress-view";

type Props = { params: Promise<{ studentId: string }> };

export async function TeacherStudentProgressPage({ params }: Readonly<Props>) {
  const { studentId } = await params;
  return <TeacherStudentProgressView studentId={studentId} />;
}
