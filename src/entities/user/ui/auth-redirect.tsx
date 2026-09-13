"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { getUserHome } from "../model/auth";
import { useAuth } from "../model/use-auth";
import { AppLoadingState } from "./app-loading-state";

export function AuthRedirect() {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (auth.status === "unauthenticated") {
      router.replace("/login");
    } else if (auth.status === "authenticated") {
      router.replace(getUserHome(auth.user));
    }
  }, [auth, router]);

  return <AppLoadingState label={auth.status === "error" ? "Не удалось определить сессию" : undefined} />;
}
