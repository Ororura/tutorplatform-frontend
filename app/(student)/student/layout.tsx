import { StudentGuard } from "@/entities/user";
import { StudentHeader } from "@/widgets/student-header";

export default function StudentLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <StudentGuard>
      <div className="min-h-screen">
        <StudentHeader />

        <div className="mx-auto max-w-[1400px] px-3 pb-10 pt-4 sm:px-5">{children}</div>
      </div>
    </StudentGuard>
  );
}
