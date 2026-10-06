import { BookOpenText, CalendarDays, ChartNoAxesCombined, ClipboardCheck, FileText, UserRound } from "lucide-react";
import Link from "next/link";

type StudentProfileSection = "overview" | "program" | "progress" | "reports" | "sessions" | "homework";

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
    id: "reports",
    label: "Отчёты",
    icon: FileText,
    href: (studentId: string) => `/teacher/students/${studentId}/reports`,
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
    <nav className="flex gap-1 overflow-x-auto border-b border-border pb-2" aria-label="Разделы ученика">
      {items.map(({ id, label, icon: Icon, href }) => {
        const selected = active === id;

        return (
          <Link key={id} aria-current={selected ? "page" : undefined} className="nav-item" href={href(studentId)}>
            <Icon size={17} aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
