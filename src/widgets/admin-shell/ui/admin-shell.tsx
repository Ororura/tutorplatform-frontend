import type { ReactNode } from "react";

import { AdminHeader } from "@/widgets/admin-header";

type Props = {
  children: ReactNode;
};

export function AdminShell({ children }: Readonly<Props>) {
  return (
    <div className="min-h-dvh">
      <AdminHeader />

      <div className="app-container app-content">{children}</div>
    </div>
  );
}
