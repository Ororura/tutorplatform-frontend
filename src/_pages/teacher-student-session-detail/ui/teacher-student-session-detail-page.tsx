import { TeacherStudentSessionDetailView } from "./teacher-student-session-detail-view";

export async function TeacherStudentSessionDetailPage({ params }: Readonly<{ params: Promise<{ studentId: string; sessionId: string }> }>) {
  const { studentId, sessionId } = await params;
  return <TeacherStudentSessionDetailView studentId={studentId} sessionId={sessionId} />;
}
