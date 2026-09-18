import type { ReactNode } from "react";

import { TeacherHeader } from "@/widgets/teacher-header";

type Props = {
  children: ReactNode;
};

export function TeacherShell({ children }: Readonly<Props>) {
  return (
    <div className="min-h-screen">
      <TeacherHeader />

      <div className="mx-auto max-w-[1600px] px-3 pb-10 pt-4 sm:px-5">{children}</div>
    </div>
  );
}
