import { TeacherStudentView } from "./teacher-student-view";

type Props = {
  params: Promise<{ studentId: string }>;
};

export async function TeacherStudentPage({ params }: Readonly<Props>) {
  const { studentId } = await params;
  return <TeacherStudentView studentId={studentId} />;
}
