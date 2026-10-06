import type { ReactNode } from "react";

import { StudentHeader } from "@/widgets/student-header";

type Props = {
  children: ReactNode;
};

export function StudentShell({ children }: Readonly<Props>) {
  return (
    <div className="min-h-dvh">
      <StudentHeader />

      <div className="app-container app-content">{children}</div>
    </div>
  );
}
