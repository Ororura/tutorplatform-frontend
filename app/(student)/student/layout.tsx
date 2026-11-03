import { StudentGuard } from "@/entities/user";
import { AppShell } from "@/widgets/app-shell";

export default function StudentLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <StudentGuard>
      <AppShell role="student">{children}</AppShell>
    </StudentGuard>
  );
}
