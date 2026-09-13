import { StudentGuard } from "@/entities/user";

export default function StudentLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <StudentGuard>{children}</StudentGuard>;
}
