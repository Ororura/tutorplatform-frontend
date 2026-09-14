import { TeacherStudentProgramView } from "./teacher-student-program-view";

type Props = { params: Promise<{ studentId: string }> };

export async function TeacherStudentProgramPage({ params }: Readonly<Props>) {
  const { studentId } = await params;
  return <TeacherStudentProgramView studentId={studentId} />;
}
