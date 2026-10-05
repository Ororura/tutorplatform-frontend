import type { ReactNode } from "react";

import { TeacherHeader } from "@/widgets/teacher-header";

type Props = {
  children: ReactNode;
};

export function TeacherShell({ children }: Readonly<Props>) {
  return (
    <div className="min-h-dvh">
      <TeacherHeader />

      <div className="app-container app-content">{children}</div>
    </div>
  );
}
