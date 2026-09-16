import { TeacherStudentSessionEditView } from "./teacher-student-session-edit-view";

export async function TeacherStudentSessionEditPage({
  params,
}: Readonly<{
  params: Promise<{ studentId: string; sessionId: string }>;
}>) {
  const { studentId, sessionId } = await params;
  return <TeacherStudentSessionEditView studentId={studentId} sessionId={sessionId} />;
}
