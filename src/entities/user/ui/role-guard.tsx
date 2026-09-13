"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { Button } from "@/shared/ui/button";

import type { CurrentUser } from "../api/current-user";
import { getRoleRedirect } from "../model/auth";
import { useAuth } from "../model/use-auth";
import { AppLoadingState } from "./app-loading-state";

type UserRole = CurrentUser["roles"][number];

export function RoleGuard({
  children,
  role,
}: Readonly<{ children: React.ReactNode; role: UserRole }>) {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();

  useEffect(() => {
    if (auth.status === "unauthenticated" || auth.status === "authenticated") {
      const destination = getRoleRedirect(
        auth.status === "authenticated" ? auth.user : null,
        role,
        pathname,
      );
      if (destination) {
        router.replace(destination);
      }
    }
  }, [auth, pathname, role, router]);

  if (auth.status === "loading" || auth.status === "unauthenticated") {
    return <AppLoadingState />;
  }

  if (auth.status === "error") {
    return (
      <main className="grid min-h-screen place-items-center px-6">
        <div className="space-y-4 text-center" role="alert">
          <p>Не удалось проверить текущую сессию.</p>
          <Button type="button" onClick={() => window.location.reload()}>
            Повторить
          </Button>
        </div>
      </main>
    );
  }

  if (!auth.user.roles.includes(role)) {
    return <AppLoadingState label="Открываем доступный раздел…" />;
  }

  return children;
}
