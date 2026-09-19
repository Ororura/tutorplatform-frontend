import { RoleGuard } from "./role-guard";

export function AdminGuard({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <RoleGuard role="ADMIN">{children}</RoleGuard>;
}
