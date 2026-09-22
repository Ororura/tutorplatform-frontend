import { BookOpenText, CalendarDays, ChartNoAxesCombined, ClipboardCheck, UserRound } from "lucide-react";
import Link from "next/link";

import { cn } from "@/shared/lib/cn";

type StudentProfileSection = "overview" | "program" | "progress" | "sessions" | "homework";

const items = [
  {
    id: "overview",
    label: "Обзор",
    icon: UserRound,
    href: (studentId: string) => `/teacher/students/${studentId}`,
  },
  {
    id: "program",
    label: "Программа",
    icon: BookOpenText,
    href: (studentId: string) => `/teacher/students/${studentId}/program`,
  },
  {
    id: "progress",
    label: "Прогресс",
    icon: ChartNoAxesCombined,
    href: (studentId: string) => `/teacher/students/${studentId}/progress`,
  },
  {
    id: "sessions",
    label: "Занятия",
    icon: CalendarDays,
    href: (studentId: string) => `/teacher/students/${studentId}/sessions`,
  },
  {
    id: "homework",
    label: "Домашние задания",
    icon: ClipboardCheck,
    href: (studentId: string) => `/teacher/students/${studentId}/homework`,
  },
] satisfies Array<{
  id: StudentProfileSection;
  label: string;
  icon: typeof UserRound;
  href: (studentId: string) => string;
}>;

export function StudentProfileNav({
  active,
  studentId,
}: Readonly<{
  active: StudentProfileSection;
  studentId: string;
}>) {
  return (
    <nav
      className="flex gap-1 overflow-x-auto rounded-[22px] border border-white/80 bg-white p-2 shadow-[0_10px_30px_rgba(45,79,135,0.05)]"
      aria-label="Разделы ученика"
    >
      {items.map(({ id, label, icon: Icon, href }) => {
        const selected = active === id;

        return (
          <Link
            key={id}
            aria-current={selected ? "page" : undefined}
            className={cn(
              "inline-flex h-11 shrink-0 items-center gap-2 rounded-2xl px-4 text-sm font-medium transition",
              selected ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
            )}
            href={href(studentId)}
          >
            <Icon size={17} aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
