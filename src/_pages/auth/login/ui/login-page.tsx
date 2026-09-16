import { Suspense } from "react";

import { LoginForm } from "@/features/auth/login";
import { GuestGuard } from "@/entities/user";

export function LoginPage() {
  return (
    <GuestGuard>
      <main className="mx-auto max-w-md px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight">Вход</h1>
        <p className="mt-3 text-neutral-600">Войдите в аккаунт преподавателя или ученика.</p>
        <Suspense fallback={<p className="mt-8 text-sm text-neutral-600">Загружаем форму…</p>}>
          <LoginForm />
        </Suspense>
      </main>
    </GuestGuard>
  );
}
