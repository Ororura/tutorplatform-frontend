import { TeacherGuard } from "@/entities/user";
import { AppShell } from "@/widgets/app-shell";

export default function TeacherLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <TeacherGuard>
      <AppShell role="teacher">{children}</AppShell>
    </TeacherGuard>
  );
}
