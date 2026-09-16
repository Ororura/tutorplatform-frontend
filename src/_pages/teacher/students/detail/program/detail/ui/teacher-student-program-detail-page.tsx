import { TeacherStudentProgramDetailView } from "./teacher-student-program-detail-view";

type Props = { params: Promise<{ studentId: string; studentProgramId: string }> };

export async function TeacherStudentProgramDetailPage({ params }: Readonly<Props>) {
  const { studentId, studentProgramId } = await params;
  return <TeacherStudentProgramDetailView studentId={studentId} studentProgramId={studentProgramId} />;
}
