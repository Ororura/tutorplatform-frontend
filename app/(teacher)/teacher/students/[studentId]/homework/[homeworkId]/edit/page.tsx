import { TeacherStudentHomeworkEditPage } from "@/_pages/teacher-student-homework-edit";

export default async function Page({
  params,
}: Readonly<{ params: Promise<{ studentId: string; homeworkId: string }> }>) {
  const { studentId, homeworkId } = await params;
  return <TeacherStudentHomeworkEditPage studentId={studentId} homeworkId={homeworkId} />;
}
