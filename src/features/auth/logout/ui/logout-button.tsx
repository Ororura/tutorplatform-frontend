"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/shared/ui/button";

import { useLogoutMutation } from "../api/logout";

export function LogoutButton() {
  const router = useRouter();
  const logout = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logout.mutateAsync();
      router.replace("/login");
    } catch {
      // The visible error below keeps the user on the authenticated page for retry.
    }
  };

  return (
    <div className="space-y-2">
      <Button type="button" onClick={handleLogout} disabled={logout.isPending}>
        {logout.isPending ? "Выходим…" : "Выйти"}
      </Button>
      {logout.isError && (
        <p className="text-sm text-red-700" role="alert">
          Не удалось выйти. Попробуйте ещё раз.
        </p>
      )}
    </div>
  );
}
