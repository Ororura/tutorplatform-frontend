"use client";

import { BookOpen } from "lucide-react";
import Link from "next/link";

import { StudentNavigation, useCurrentUserQuery } from "@/entities/user";
import { LogoutButton } from "@/features/auth/logout";

function getInitials(name?: string) {
  if (!name) return "У";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function StudentHeader() {
  const currentUser = useCurrentUserQuery();
  const displayName = currentUser.data?.displayName ?? "Ученик";

  return (
    <header className="sticky top-0 z-40 pt-3">
      <div className="mx-auto max-w-[1600px] px-3 sm:px-5">
        <div className="overflow-hidden rounded-3xl border border-white/80 bg-white/95 shadow-[0_12px_40px_rgba(45,79,135,0.08)] backdrop-blur-xl">
          <div className="flex h-16 items-center gap-5 px-4 sm:px-5">
            <Link className="flex shrink-0 items-center gap-3" href="/student">
              <span className="flex size-10 items-center justify-center rounded-[14px] bg-linear-to-br from-blue-500 to-blue-600 text-white shadow-sm shadow-blue-200">
                <BookOpen size={21} strokeWidth={2.1} aria-hidden="true" />
              </span>

              <span className="hidden leading-tight sm:block">
                <span className="block text-[15px] font-semibold tracking-tight text-slate-950">Умнее Вместе</span>
                <span className="mt-0.5 block text-[11px] text-slate-500">Кабинет ученика</span>
              </span>
            </Link>

            <StudentNavigation />

            <div className="ml-auto flex items-center gap-3">
              <div className="hidden items-center gap-3 border-r border-slate-100 pr-4 md:flex">
                <span className="flex size-9 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-700">
                  {getInitials(displayName)}
                </span>

                <span className="hidden leading-tight xl:block">
                  <span className="block max-w-40 truncate text-sm font-medium text-slate-900">{displayName}</span>
                  <span className="block text-xs text-slate-500">Ученик</span>
                </span>
              </div>

              <LogoutButton />
            </div>
          </div>

          <StudentNavigation mobile />
        </div>
      </div>
    </header>
  );
}
