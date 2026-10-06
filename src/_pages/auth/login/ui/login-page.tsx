import { Suspense } from "react";
import { BookOpen } from "lucide-react";

import { GuestGuard } from "@/entities/user";
import { LoginForm } from "@/features/auth/login";

export function LoginPage() {
  return (
    <GuestGuard>
      <main className="flex min-h-svh flex-col bg-background text-foreground">
        <header className="mx-auto flex w-full max-w-(--auth-width) items-center gap-3 px-4 py-6 sm:px-0">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-surface bg-primary text-primary-foreground">
              <BookOpen className="size-5" strokeWidth={2} aria-hidden="true" />
            </span>
            <div>
              <p className="text-base font-semibold tracking-tight">Умнее Вместе</p>
              <p className="text-xs text-foreground-muted">Учиться. Развиваться. Вместе.</p>
            </div>
          </div>
        </header>
        <section className="mx-auto flex w-full max-w-(--auth-width) flex-1 items-center px-4 py-8 sm:px-0">
          <div className="surface w-full">
            <h1 className="page-title">Вход</h1>
            <p className="page-description mt-2">Войдите в аккаунт преподавателя или ученика.</p>
            <Suspense fallback={<p className="mt-7 text-sm text-foreground-muted">Загружаем форму…</p>}>
              <LoginForm />
            </Suspense>
          </div>
        </section>
        <footer className="mx-auto w-full max-w-(--auth-width) px-4 pb-6 text-center text-xs text-foreground-muted sm:px-0">
          © {new Date().getFullYear()} Умнее Вместе
        </footer>
      </main>
    </GuestGuard>
  );
}
