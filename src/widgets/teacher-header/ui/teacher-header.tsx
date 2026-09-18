"use client";

import { BookOpen, BookOpenText, ClipboardList, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useCurrentUserQuery } from "@/entities/user";
import { LogoutButton } from "@/features/auth/logout";

const navigation = [
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

  return (
    <header className="sticky top-0 z-40 pt-3">
      <div className="mx-auto max-w-[1600px] px-3 sm:px-5">
        <div className="overflow-hidden rounded-[24px] border border-white/80 bg-white/95 shadow-[0_12px_40px_rgba(45,79,135,0.08)] backdrop-blur-xl">
          <div className="flex h-16 items-center gap-5 px-4 sm:px-5">
            <Link className="flex shrink-0 items-center gap-3" href="/teacher/students">
              <span className="flex size-10 items-center justify-center rounded-[14px] bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-sm shadow-blue-200">
                <BookOpen size={21} strokeWidth={2.1} />
              </span>

              <span className="hidden leading-tight sm:block">
                <span className="block text-[15px] font-semibold tracking-tight text-slate-950">Умнее Вместе</span>
                <span className="mt-0.5 block text-[11px] text-slate-500">Платформа для репетиторов</span>
              </span>
            </Link>

            <nav className="hidden h-full items-center gap-1 lg:flex" aria-label="Навигация преподавателя">
              {navigation.map(({ href, label, icon: Icon }) => {
                const active = isActivePath(pathname, href);

                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={[
                      "flex h-10 items-center gap-2 rounded-xl px-3.5 text-sm font-medium transition",
                      active ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
                    ].join(" ")}
                  >
                    <Icon size={17} />
                    {label}
                  </Link>
                );
              })}
            </nav>

            <div className="ml-auto flex items-center gap-3">
              <div className="hidden items-center gap-3 border-r border-slate-100 pr-4 md:flex">
                <span className="flex size-9 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-700">
                  {getInitials(displayName)}
                </span>

                <span className="hidden leading-tight xl:block">
                  <span className="block max-w-40 truncate text-sm font-medium text-slate-900">{displayName}</span>
                  <span className="block text-xs text-slate-500">Преподаватель</span>
                </span>
              </div>

              <LogoutButton />
            </div>
          </div>

          <nav
            className="flex gap-1 overflow-x-auto border-t border-slate-100 px-3 py-2 lg:hidden"
            aria-label="Мобильная навигация преподавателя"
          >
            {navigation.map(({ href, label, icon: Icon }) => {
              const active = isActivePath(pathname, href);

              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition",
                    active ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50",
                  ].join(" ")}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
