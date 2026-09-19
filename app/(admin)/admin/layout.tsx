import { AdminGuard } from "@/entities/user";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AdminGuard>{children}</AdminGuard>;
}
