import { RoleGuard } from "./role-guard";

export function StudentGuard({ children }: Readonly<{ children: React.ReactNode }>) {
  return <RoleGuard role="STUDENT">{children}</RoleGuard>;
}
