import { TeacherStudentReportDetailView } from "./teacher-student-report-detail-view";

type Props = { params: Promise<{ studentId: string; reportId: string }> };

export async function TeacherStudentReportDetailPage({ params }: Readonly<Props>) {
  const { studentId, reportId } = await params;
  return <TeacherStudentReportDetailView studentId={studentId} reportId={reportId} />;
}
