import type { ReactNode } from "react";

import { StudentHeader } from "@/widgets/student-header";

type Props = {
  children: ReactNode;
};

export function StudentShell({ children }: Readonly<Props>) {
  return (
    <div className="min-h-screen">
      <StudentHeader />

      <div className="mx-auto max-w-[1600px] px-3 pb-10 pt-4 sm:px-5">{children}</div>
    </div>
  );
}
