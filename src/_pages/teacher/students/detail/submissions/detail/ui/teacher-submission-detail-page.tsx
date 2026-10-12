import { TeacherSubmissionDetailView } from "./teacher-submission-detail-view";

export async function TeacherSubmissionDetailPage({
  params,
}: Readonly<{ params: Promise<{ studentId: string; submissionId: string }> }>) {
  const { studentId, submissionId } = await params;
  return <TeacherSubmissionDetailView key={submissionId} studentId={studentId} submissionId={submissionId} />;
}
