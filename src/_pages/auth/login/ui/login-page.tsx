import { PageHeader } from "@/shared/ui/page-header";
import { Suspense } from "react";
import { GuestGuard } from "@/entities/user";
import { LoginForm } from "@/features/auth/login";
import { AuthShell } from "@/shared/ui/auth-shell";
import { LoadingState } from "@/shared/ui/feedback";

export function LoginPage() {
  return (
    <GuestGuard>
      <AuthShell>
        <PageHeader title="Вход" description="Войдите в аккаунт преподавателя или ученика." />
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
