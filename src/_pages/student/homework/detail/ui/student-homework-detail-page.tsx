import { StudentHomeworkDetailView } from "./student-homework-detail-view";

export async function StudentHomeworkDetailPage({
  params,
}: Readonly<{ params: Promise<{ homeworkId: string }> }>) {
  const { homeworkId } = await params;
  return <StudentHomeworkDetailView homeworkId={homeworkId} />;
}
