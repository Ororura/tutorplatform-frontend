"use client";

import { useState, useRef, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpenText,
  ClipboardList,
  GraduationCap,
  House,
  LayoutDashboard,
  MailPlus,
  Menu,
  Settings2,
  ShieldCheck,
  Users,
  UserRound,
} from "lucide-react";
import { StudentNavigation, useCurrentUserQuery } from "@/entities/user";
import { LogoutButton } from "@/features/auth/logout";
import { AppBrand } from "@/shared/ui/app-brand";
import { Button } from "@/shared/ui/button";
import { Sheet, SheetTrigger, SheetContent, SheetTitle, SheetDescription } from "@/shared/ui/sheet";

import styles from "./student-shell.module.css";

type Role = "teacher" | "student" | "admin";
const labels: Record<Role, string> = {
  teacher: "Кабинет преподавателя",
  student: "Кабинет ученика",
  admin: "Администрирование",
};
const navigation = {
  teacher: [
    { href: "/teacher", label: "Главная", icon: House },
    { href: "/teacher/students", label: "Ученики", icon: Users },
    { href: "/teacher/programs", label: "Программы", icon: BookOpenText },
    { href: "/teacher/tasks", label: "Задания", icon: ClipboardList },
  ],
  admin: [
    { href: "/admin", label: "Обзор", icon: LayoutDashboard },
    { href: "/admin/invitations", label: "Приглашения", icon: MailPlus },
    { href: "/admin/settings", label: "Настройки", icon: Settings2 },
  ],
};

function RoleNavigation({ role, mobile = false }: Readonly<{ role: Role; mobile?: boolean }>) {
  const pathname = usePathname();
  if (role === "student")
    return (
      <div className="[&_nav]:h-auto [&_nav]:flex-col [&_nav]:items-stretch [&_nav]:gap-1 [&_nav]:overflow-visible [&_nav]:border-0 [&_nav]:p-0 [&_a]:w-full">
        <StudentNavigation mobile={mobile} />
      </div>
    );
  const name = role === "teacher" ? "преподавателя" : "администратора";
  return (
    <nav aria-label={`${mobile ? "Мобильная навигация" : "Навигация"} ${name}`} className="flex flex-col gap-1">
      {navigation[role].map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== `/${role}` && pathname.startsWith(`${href}/`));
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined} className="nav-item">
            <Icon size={18} aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ role, children }: Readonly<{ role: Role; children: ReactNode }>) {
  const [open, setOpen] = useState(false);
  const mobileContent = useRef<HTMLDivElement>(null);
  const user = useCurrentUserQuery();
  const name = user.data?.displayName || labels[role];
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const switchRole =
    role === "teacher" && user.data?.roles.includes("ADMIN")
      ? { href: "/admin", label: "Администрирование", icon: ShieldCheck }
      : role === "admin" && user.data?.roles.includes("TEACHER")
        ? { href: "/teacher", label: "Кабинет преподавателя", icon: GraduationCap }
        : undefined;
  const footer = (
    <div className="space-y-4 border-t border-border p-4">
      {switchRole && (
        <Link
          href={switchRole.href}
          className="flex items-center gap-2 rounded-md py-2 text-xs font-medium text-muted-foreground hover:text-primary"
        >
          <switchRole.icon size={16} aria-hidden="true" />
          {switchRole.label}
        </Link>
      )}
      <div className="flex min-w-0 items-center gap-3">
        <span
          aria-hidden="true"
          className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold"
        >
          {initials}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium">{name}</span>
          <span className="block truncate text-xs text-muted-foreground">{user.data?.email}</span>
        </span>
      </div>
      <div className="[&_button]:w-full">
        <LogoutButton />
      </div>
    </div>
  );
  const brand =
    role === "student" ? (
      <Link href="/student" aria-label="Tutor Platform — главная" className={styles.brand}>
        <span className={styles.mark} aria-hidden="true">
          <i />
          <i />
        </span>
        Tutor Platform
      </Link>
    ) : (
      <AppBrand href={`/${role}`} subtitle={labels[role]} />
    );
  const profile =
    role === "student" ? (
      <details className={styles.profile}>
        <summary>
          <UserRound size={22} aria-hidden="true" />
          <span>{name}</span>
        </summary>
        {footer}
      </details>
    ) : (
      footer
    );
  return (
    <div className={role === "student" ? styles.student : "min-h-dvh"}>
      <a
        href="#workspace-content"
        className="sr-only fixed left-4 top-4 z-60 rounded-md bg-primary px-4 py-3 text-primary-foreground focus:not-sr-only"
      >
        Перейти к содержимому
      </a>
      <aside
        aria-label="Боковая панель"
        data-shell-sidebar
        className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-border bg-sidebar xl:flex"
      >
        <div className="flex h-20 items-center px-5">{brand}</div>
        <div className="flex-1 overflow-y-auto p-3">
          {role !== "student" && (
            <p className="mb-3 px-3 text-xs font-medium text-muted-foreground">Рабочее пространство</p>
          )}
          <RoleNavigation role={role} />
        </div>
        {profile}
      </aside>
      <div className="min-w-0 xl:pl-60">
        <header
          data-shell-header
          className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-card px-(--page-gutter)"
        >
          <div className="xl:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Открыть меню">
                  <Menu size={20} aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetContent
                ref={mobileContent}
                onOpenAutoFocus={(event) => {
                  const firstLink = mobileContent.current?.querySelector<HTMLElement>("nav a");
                  if (firstLink) {
                    event.preventDefault();
                    firstLink.focus();
                  }
                }}
                onClickCapture={(event) => {
                  if (event.target instanceof Element && event.target.closest("a")) setOpen(false);
                }}
              >
                <div className="p-5 pr-12">
                  <SheetTitle className="text-base font-semibold">
                    {role === "student" ? "Tutor Platform" : "Умнее Вместе"}
                  </SheetTitle>
                  <SheetDescription className="mt-1 text-xs text-muted-foreground">{labels[role]}</SheetDescription>
                </div>
                <div className="flex-1 overflow-y-auto p-3">
                  <RoleNavigation role={role} mobile />
                </div>
                {footer}
              </SheetContent>
            </Sheet>
          </div>
          <div className="xl:hidden">{brand}</div>
          <p className="hidden text-sm text-muted-foreground xl:block">{labels[role]}</p>
          <span className="ml-auto hidden max-w-60 truncate text-sm font-medium sm:block">{name}</span>
        </header>
        <div id="workspace-content" tabIndex={-1} className="app-container app-content outline-none">
          {children}
        </div>
      </div>
    </div>
  );
}
