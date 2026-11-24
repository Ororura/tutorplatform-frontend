import type { ReactNode } from "react";
import { AppBrand } from "@/shared/ui/app-brand";
import { Card } from "@/shared/ui/card";
import { cn } from "@/shared/lib/cn";

export function AuthShell({ children, wide = false }: Readonly<{ children: ReactNode; wide?: boolean }>) {
  return (
    <main className="app-container flex min-h-svh flex-col items-center py-8 sm:py-12">
      <header className="mb-8">
        <AppBrand href="/login" subtitle="Обучение в одном пространстве" />
      </header>
      <div className={cn("flex w-full flex-1 items-center", wide ? "page-form" : "max-w-(--auth-width)")}>
        <Card className="w-full p-(--surface-padding)">{children}</Card>
      </div>
      <footer className="mt-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Умнее Вместе
      </footer>
    </main>
  );
}
