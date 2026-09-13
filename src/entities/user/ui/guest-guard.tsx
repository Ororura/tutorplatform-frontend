"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Button } from "@/shared/ui/button";

import { getUserHome } from "../model/auth";
import { useAuth } from "../model/use-auth";
import { AppLoadingState } from "./app-loading-state";

export function GuestGuard({ children }: Readonly<{ children: React.ReactNode }>) {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (auth.status === "authenticated") {
      router.replace(getUserHome(auth.user));
    }
  }, [auth, router]);

  if (auth.status === "loading" || auth.status === "authenticated") {
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

  return children;
}
