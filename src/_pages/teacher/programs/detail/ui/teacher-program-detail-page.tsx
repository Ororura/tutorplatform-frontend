import { TeacherProgramDetailView } from "./teacher-program-detail-view";

export async function TeacherProgramDetailPage({ params }: Readonly<{ params: Promise<{ programId: string }> }>) {
  const { programId } = await params;
  return <TeacherProgramDetailView programId={programId} />;
}
