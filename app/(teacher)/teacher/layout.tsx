import { TeacherGuard } from "@/entities/user";

export default function TeacherLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <TeacherGuard>{children}</TeacherGuard>;
}
