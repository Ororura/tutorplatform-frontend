import { TeacherProgramTopicMaterialsView } from "./teacher-program-topic-materials-view";

export async function TeacherProgramTopicMaterialsPage({
  params,
}: Readonly<{ params: Promise<{ programId: string; topicId: string }> }>) {
  const { programId, topicId } = await params;
  return <TeacherProgramTopicMaterialsView programId={programId} topicId={topicId} />;
}
