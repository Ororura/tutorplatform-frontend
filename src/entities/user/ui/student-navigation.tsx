"use client";

import { BookOpenText, ClipboardCheck, Home } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  {
    href: "/student",
    label: "Главная",
    icon: Home,
  },
  {
    href: "/student/programs",
    label: "Мои программы",
    icon: BookOpenText,
  },
  {
    href: "/student/homework",
    label: "Домашние задания",
    icon: ClipboardCheck,
  },
] as const;

function isActivePath(pathname: string, href: string) {
  if (href === "/student") return pathname === href;

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function StudentNavigation({ mobile = false }: Readonly<{ mobile?: boolean }>) {
  const pathname = usePathname();

  return (
    <nav
      aria-label={mobile ? "Мобильная навигация ученика" : "Навигация ученика"}
      className={
        mobile
          ? "flex gap-1 overflow-x-auto border-t border-slate-100 px-3 py-2 lg:hidden"
          : "hidden h-full items-center gap-1 lg:flex"
      }
    >
      {navigation.map(({ href, label, icon: Icon }) => {
        const active = isActivePath(pathname, href);

        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={[
              "flex shrink-0 items-center gap-2 rounded-xl text-sm font-medium transition",
              mobile ? "px-3.5 py-2" : "h-10 px-3.5",
              active ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
            ].join(" ")}
          >
            <Icon size={mobile ? 16 : 17} aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
