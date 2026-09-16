import { StudentGuard, StudentNavigation } from "@/entities/user";

export default function StudentLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <StudentGuard>
      <StudentNavigation />
      {children}
    </StudentGuard>
  );
}
