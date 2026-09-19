"use client";

import { BookOpen, GraduationCap, LayoutDashboard, MailPlus, Settings2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useCurrentUserQuery } from "@/entities/user";
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
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <div className="flex h-18 items-center gap-6">
          <Link
            href="/admin"
            className="flex shrink-0 items-center gap-3"
            aria-label="Главная административного кабинета"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-blue-600 text-white">
              <BookOpen size={21} />
            </span>

            <span className="hidden leading-tight sm:block">
              <span className="block text-sm font-semibold text-neutral-950">Умнее Вместе</span>

              <span className="block text-xs text-neutral-500">Администрирование</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Навигация администратора">
            {navigation.map(({ href, label, icon: Icon }) => {
              const active = isActivePath(pathname, href);

              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium transition-colors",
                    active
                      ? "bg-blue-50 text-blue-700"
                      : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950",
                  ].join(" ")}
                >
                  <Icon size={17} />

                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            {hasTeacherRole && (
              <Link
                href="/teacher/students"
                className="hidden items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 lg:flex"
              >
                <GraduationCap size={17} />
                Кабинет преподавателя
              </Link>
            )}

            <div className="hidden min-w-0 border-l border-neutral-200 pl-4 xl:block">
              <p className="max-w-40 truncate text-sm font-medium text-neutral-900">
                {user?.displayName || "Администратор"}
              </p>

              <p className="max-w-40 truncate text-xs text-neutral-500">{user?.email || "Администратор"}</p>
            </div>

            <LogoutButton />
          </div>
        </div>

        <nav
          className="flex gap-1 overflow-x-auto border-t border-neutral-100 py-2 md:hidden"
          aria-label="Мобильная навигация администратора"
        >
          {navigation.map(({ href, label, icon: Icon }) => {
            const active = isActivePath(pathname, href);

            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={[
                  "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
                  active ? "bg-blue-50 text-blue-700" : "text-neutral-600 hover:bg-neutral-50",
                ].join(" ")}
              >
                <Icon size={16} />

                {label}
              </Link>
            );
          })}

          {hasTeacherRole && (
            <Link
              href="/teacher/students"
              className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 lg:hidden"
            >
              <GraduationCap size={16} />
              Преподаватель
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
