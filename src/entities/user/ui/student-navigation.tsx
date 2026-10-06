"use client";

import { BookOpenText, ChartNoAxesCombined, ClipboardCheck, Home } from "lucide-react";
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
  {
    href: "/student/progress",
    label: "Прогресс",
    icon: ChartNoAxesCombined,
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
      className={mobile ? "nav-mobile xl:hidden" : "hidden h-full items-center gap-1 xl:flex"}
    >
      {navigation.map(({ href, label, icon: Icon }) => {
        const active = isActivePath(pathname, href);

        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined} className="nav-item">
            <Icon size={mobile ? 16 : 17} aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
