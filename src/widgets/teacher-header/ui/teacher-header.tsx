"use client";

import { BookOpenText, ClipboardList, House, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useCurrentUserQuery } from "@/entities/user";
import { AppBrand } from "@/shared/ui/app-brand";
import { LogoutButton } from "@/features/auth/logout";

const navigation = [
  {
    href: "/teacher",
    label: "Главная",
    icon: House,
  },
  {
    href: "/teacher/students",
    label: "Ученики",
    icon: Users,
  },
  {
    href: "/teacher/programs",
    label: "Программы",
    icon: BookOpenText,
  },
  {
    href: "/teacher/tasks",
    label: "Задания",
    icon: ClipboardList,
  },
] as const;

function isActivePath(pathname: string, href: string) {
  if (href === "/teacher") return pathname === href;

  return pathname === href || pathname.startsWith(`${href}/`);
}

function getInitials(name?: string) {
  if (!name) return "П";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function TeacherHeader() {
  const pathname = usePathname();
  const currentUser = useCurrentUserQuery();
  const displayName = currentUser.data?.displayName ?? "Преподаватель";
  const isAdmin = currentUser.data?.roles.includes("ADMIN") ?? false;

  return (
    <header className="app-header">
      <div className="app-container">
        <div className="min-w-0">
          <div className="app-header-row">
            <AppBrand href="/teacher" subtitle="Платформа для репетиторов" />

            <nav className="hidden h-full items-center gap-1 xl:flex" aria-label="Навигация преподавателя">
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
              <div className="hidden items-center gap-3 border-r border-border pr-4 md:flex">
                <span className="flex size-9 items-center justify-center rounded-full bg-surface-subtle text-sm font-semibold text-foreground-muted">
                  {getInitials(displayName)}
                </span>

                <span className="hidden leading-tight xl:block">
                  <span className="block max-w-40 truncate text-sm font-medium text-foreground">{displayName}</span>
                  <span className="block text-xs text-(--text-secondary)">Преподаватель</span>
                </span>
              </div>

              {isAdmin && (
                <Link
                  href="/admin"
                  className="hidden shrink-0 items-center gap-2 nav-item border border-border xl:inline-flex"
                >
                  <ShieldCheck size={17} aria-hidden="true" />
                  Администрирование
                </Link>
              )}

              <LogoutButton />
            </div>
          </div>

          <nav className="nav-mobile xl:hidden" aria-label="Мобильная навигация преподавателя">
            {navigation.map(({ href, label, icon: Icon }) => {
              const active = isActivePath(pathname, href);

              return (
                <Link key={href} href={href} aria-current={active ? "page" : undefined} className="nav-item">
                  <Icon size={16} aria-hidden="true" />
                  {label}
                </Link>
              );
            })}
            {isAdmin && (
              <Link href="/admin" className="nav-item">
                <ShieldCheck size={16} aria-hidden="true" />
                Администрирование
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
