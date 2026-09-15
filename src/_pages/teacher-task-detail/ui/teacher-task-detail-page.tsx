import { TeacherTaskDetailView } from "./teacher-task-detail-view";

export async function TeacherTaskDetailPage({ params }: Readonly<{ params: Promise<{ taskId: string }> }>) {
  const { taskId } = await params;
  return <TeacherTaskDetailView taskId={taskId} />;
}
