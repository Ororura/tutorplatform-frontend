import { StudentGuard } from "@/entities/user";
import { StudentShell } from "@/widgets/student-shell";

export default function StudentLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <StudentGuard>
      <StudentShell>{children}</StudentShell>
    </StudentGuard>
  );
}
