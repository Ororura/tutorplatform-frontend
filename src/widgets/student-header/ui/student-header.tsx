"use client";

import { StudentNavigation, useCurrentUserQuery } from "@/entities/user";
import { AppBrand } from "@/shared/ui/app-brand";
import { LogoutButton } from "@/features/auth/logout";

function getInitials(name?: string) {
  if (!name) return "У";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function StudentHeader() {
  const currentUser = useCurrentUserQuery();
  const displayName = currentUser.data?.displayName ?? "Ученик";

  return (
    <header className="app-header">
      <div className="app-container">
        <div className="min-w-0">
          <div className="app-header-row">
            <AppBrand href="/student" subtitle="Кабинет ученика" />

            <StudentNavigation />

            <div className="ml-auto flex items-center gap-3">
              <div className="hidden items-center gap-3 border-r border-border pr-4 md:flex">
                <span className="flex size-9 items-center justify-center rounded-full bg-surface-subtle text-sm font-semibold text-foreground-muted">
                  {getInitials(displayName)}
                </span>

                <span className="hidden leading-tight xl:block">
                  <span className="block max-w-40 truncate text-sm font-medium text-foreground">{displayName}</span>
                  <span className="block text-xs text-foreground-muted">Ученик</span>
                </span>
              </div>

              <LogoutButton />
            </div>
          </div>

          <StudentNavigation mobile />
        </div>
      </div>
    </header>
  );
}
