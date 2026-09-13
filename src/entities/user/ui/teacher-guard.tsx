import { RoleGuard } from "./role-guard";

export function TeacherGuard({ children }: Readonly<{ children: React.ReactNode }>) {
  return <RoleGuard role="TEACHER">{children}</RoleGuard>;
}
