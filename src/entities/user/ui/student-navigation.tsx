import { ClipboardCheck } from "lucide-react";
import Link from "next/link";

export function StudentNavigation() {
  return (
    <nav aria-label="Навигация ученика" className="flex items-center">
      <Link
        className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-50 px-3 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
        href="/student/homework"
      >
        <ClipboardCheck size={17} aria-hidden="true" />
        Домашние задания
      </Link>
    </nav>
  );
}
