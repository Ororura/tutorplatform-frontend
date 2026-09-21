import { StudentProgramTopicView } from "./student-program-topic-view";

type Props = { params: Promise<{ studentProgramId: string; topicId: string }> };

export async function StudentProgramTopicPage({ params }: Readonly<Props>) {
  const { studentProgramId, topicId } = await params;
  return <StudentProgramTopicView studentProgramId={studentProgramId} topicId={topicId} />;
}
