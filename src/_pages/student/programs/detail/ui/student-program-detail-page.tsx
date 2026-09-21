import { StudentProgramDetailView } from "./student-program-detail-view";

type Props = { params: Promise<{ studentProgramId: string }> };

export async function StudentProgramDetailPage({ params }: Readonly<Props>) {
  const { studentProgramId } = await params;
  return <StudentProgramDetailView studentProgramId={studentProgramId} />;
}
