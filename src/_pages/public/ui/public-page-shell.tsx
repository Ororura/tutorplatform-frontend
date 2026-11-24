import type { ReactNode } from "react";
import { AppBrand } from "@/shared/ui/app-brand";

export function PublicPageShell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-border bg-card">
        <div className="app-container page-content flex h-16 items-center">
          <AppBrand href="/" subtitle="Обучение в одном пространстве" />
        </div>
      </header>
      <main className="app-container app-content page-content page-stack">{children}</main>
    </div>
  );
}
