import Link from "next/link";

import { cn } from "@/shared/lib/cn";

export function StudentProfileNav({
  active,
  studentId,
}: Readonly<{ active: "overview" | "program" | "sessions" | "homework"; studentId: string }>) {
  const itemClass = "inline-block border-b-2 px-1 pb-3 text-sm font-medium";

  return (
    <nav className="flex gap-6 border-b border-neutral-200" aria-label="Разделы ученика">
      <Link
        aria-current={active === "overview" ? "page" : undefined}
        className={cn(itemClass, active === "overview" ? "border-neutral-900" : "border-transparent text-neutral-600")}
        href={`/teacher/students/${studentId}`}
      >
        Обзор
      </Link>
      <Link
        aria-current={active === "program" ? "page" : undefined}
        className={cn(itemClass, active === "program" ? "border-neutral-900" : "border-transparent text-neutral-600")}
        href={`/teacher/students/${studentId}/program`}
      >
        Программа
      </Link>
      <Link
        aria-current={active === "sessions" ? "page" : undefined}
        className={cn(itemClass, active === "sessions" ? "border-neutral-900" : "border-transparent text-neutral-600")}
        href={`/teacher/students/${studentId}/sessions`}
      >
        Занятия
      </Link>
      <Link
        aria-current={active === "homework" ? "page" : undefined}
        className={cn(itemClass, active === "homework" ? "border-neutral-900" : "border-transparent text-neutral-600")}
        href={`/teacher/students/${studentId}/homework`}
      >
        Домашние задания
      </Link>
    </nav>
  );
}
