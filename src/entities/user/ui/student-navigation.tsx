import Link from "next/link";

export function StudentNavigation() {
  return (
    <nav aria-label="Навигация ученика" className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex h-14 max-w-4xl items-center px-6">
        <Link className="text-sm font-medium text-neutral-900" href="/student/homework">
          Домашние задания
        </Link>
      </div>
    </nav>
  );
}
