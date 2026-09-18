import { TeacherGuard } from "@/entities/user";
import { TeacherShell } from "@/widgets/teacher-shell";

export default function TeacherLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <TeacherGuard>
      <TeacherShell>{children}</TeacherShell>
    </TeacherGuard>
  );
}
