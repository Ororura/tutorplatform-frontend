import { AdminGuard } from "@/entities/user";
import { AppShell } from "@/widgets/app-shell";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AdminGuard>
      <AppShell role="admin">{children}</AppShell>
    </AdminGuard>
  );
}
