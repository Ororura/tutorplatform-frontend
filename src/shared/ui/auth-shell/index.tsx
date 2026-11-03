import type { ReactNode } from "react";
import { AppBrand } from "@/shared/ui/app-brand";
import { Card } from "@/shared/ui/card";
import { cn } from "@/shared/lib/cn";

export function AuthShell({ children, wide = false }: Readonly<{ children: ReactNode; wide?: boolean }>) {
  return (
    <main className="flex min-h-svh flex-col items-center px-4 py-8 sm:py-12">
      <header className="mb-8">
        <AppBrand href="/login" subtitle="Обучение в одном пространстве" />
      </header>
      <div className={cn("flex w-full flex-1 items-center", wide ? "max-w-xl" : "max-w-md")}>
        <Card className="w-full p-6 sm:p-8">{children}</Card>
      </div>
      <footer className="mt-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Умнее Вместе
      </footer>
    </main>
  );
}
