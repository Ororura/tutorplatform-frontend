"use client";

import { GraduationCap, LayoutDashboard, MailPlus, Settings2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useCurrentUserQuery } from "@/entities/user";
import { AppBrand } from "@/shared/ui/app-brand";
import { LogoutButton } from "@/features/auth/logout";

const navigation = [
  {
    href: "/admin",
    label: "Обзор",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/settings",
    label: "Настройки",
    icon: Settings2,
  },
  {
    href: "/admin/invitations",
    label: "Приглашения",
    icon: MailPlus,
  },
] as const;

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/admin") {
    return pathname === "/admin";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminHeader() {
  const pathname = usePathname();
  const currentUser = useCurrentUserQuery();

  const user = currentUser.data;
  const hasTeacherRole = user?.roles.includes("TEACHER") ?? false;

  return (
    <header className="app-header">
      <div className="app-container">
        <div className="app-header-row">
          <AppBrand href="/admin" subtitle="Администрирование" label="Главная административного кабинета" />

          <nav className="hidden items-center gap-1 xl:flex" aria-label="Навигация администратора">
            {navigation.map(({ href, label, icon: Icon }) => {
              const active = isActivePath(pathname, href);

              return (
                <Link key={href} href={href} aria-current={active ? "page" : undefined} className="nav-item">
                  <Icon size={17} aria-hidden="true" />

                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            {hasTeacherRole && (
              <Link
                href="/teacher/students"
                className="hidden items-center gap-2 rounded-surface border border-border px-3 py-2 text-sm font-medium text-foreground-muted transition-colors hover:bg-surface-subtle lg:flex"
              >
                <GraduationCap size={17} aria-hidden="true" />
                Кабинет преподавателя
              </Link>
            )}

            <div className="hidden min-w-0 border-l border-border pl-4 xl:block">
              <p className="max-w-40 truncate text-sm font-medium text-foreground">
                {user?.displayName || "Администратор"}
              </p>

              <p className="max-w-40 truncate text-xs text-foreground-muted">{user?.email || "Администратор"}</p>
            </div>

            <LogoutButton />
          </div>
        </div>

        <nav className="nav-mobile xl:hidden" aria-label="Мобильная навигация администратора">
          {navigation.map(({ href, label, icon: Icon }) => {
            const active = isActivePath(pathname, href);

            return (
              <Link key={href} href={href} aria-current={active ? "page" : undefined} className="nav-item">
                <Icon size={16} aria-hidden="true" />

                {label}
              </Link>
            );
          })}

          {hasTeacherRole && (
            <Link
              href="/teacher/students"
              className="flex shrink-0 items-center gap-2 rounded-inset px-3 py-2 text-sm font-medium text-foreground-muted hover:bg-surface-subtle lg:hidden"
            >
              <GraduationCap size={16} aria-hidden="true" />
              Преподаватель
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
