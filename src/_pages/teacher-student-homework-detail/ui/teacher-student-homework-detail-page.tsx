import { TeacherStudentHomeworkDetailView } from "./teacher-student-homework-detail-view";

export async function TeacherStudentHomeworkDetailPage({
  params,
}: Readonly<{
  params: Promise<{ studentId: string; homeworkId: string }>;
}>) {
  const { studentId, homeworkId } = await params;
  return <TeacherStudentHomeworkDetailView studentId={studentId} homeworkId={homeworkId} />;
}
