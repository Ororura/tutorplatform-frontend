import type { ReactNode } from "react";

import { AdminHeader } from "@/widgets/admin-header";

type Props = {
  children: ReactNode;
};

export function AdminShell({ children }: Readonly<Props>) {
  return (
    <div className="min-h-screen bg-neutral-50/50">
      <AdminHeader />

      {children}
    </div>
  );
}
