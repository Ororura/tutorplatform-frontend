import { Suspense } from "react";
import { GuestGuard } from "@/entities/user";
import { LoginForm } from "@/features/auth/login";
import { AuthShell } from "@/shared/ui/auth-shell";
import { LoadingState } from "@/shared/ui/feedback";

export function LoginPage() {
  return (
    <GuestGuard>
      <AuthShell>
        <h1 className="page-title">Вход</h1>
        <p className="page-description mt-2">Войдите в аккаунт преподавателя или ученика.</p>
        <Suspense
          fallback={
            <div className="mt-6">
              <LoadingState>Загружаем форму…</LoadingState>
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </AuthShell>
    </GuestGuard>
  );
}
