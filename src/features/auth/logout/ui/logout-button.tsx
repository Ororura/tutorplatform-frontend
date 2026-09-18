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
      // Error remains visible below so the user can retry.
    }
  };

  return (
    <div className="space-y-1">
      <Button type="button" variant="secondary" onClick={handleLogout} disabled={logout.isPending}>
        {logout.isPending ? "Выходим…" : "Выйти"}
      </Button>

      {logout.isError && (
        <p className="max-w-40 text-xs text-red-600" role="alert">
          Не удалось выйти.
        </p>
      )}
    </div>
  );
}
