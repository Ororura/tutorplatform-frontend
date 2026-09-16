import { TeacherStudentTopicView } from "./teacher-student-topic-view";

type Props = { params: Promise<{ studentId: string; studentProgramId: string; topicId: string }> };

export async function TeacherStudentTopicPage({ params }: Readonly<Props>) {
  const { studentId, studentProgramId, topicId } = await params;
  return <TeacherStudentTopicView studentId={studentId} studentProgramId={studentProgramId} topicId={topicId} />;
}
