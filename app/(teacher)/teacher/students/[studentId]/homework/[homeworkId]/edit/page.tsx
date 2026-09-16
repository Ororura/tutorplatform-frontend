import { TeacherStudentHomeworkEditPage } from "@/_pages/teacher/students/detail/homeworks/edit";

export default async function Page({
  params,
}: Readonly<{ params: Promise<{ studentId: string; homeworkId: string }> }>) {
  const { studentId, homeworkId } = await params;
  return <TeacherStudentHomeworkEditPage studentId={studentId} homeworkId={homeworkId} />;
}
