import { BookOpenText } from "lucide-react";

import { StudentNavigation } from "@/entities/user";
import { LogoutButton } from "@/features/auth/logout";

export function StudentHeader() {
  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-5">
      <div className="mx-auto max-w-[1400px] rounded-[24px] border border-white/80 bg-white/95 shadow-[0_10px_40px_rgba(45,79,135,0.07)] backdrop-blur">
        <div className="flex min-h-16 items-center gap-4 px-4 sm:px-5">
          <div className="flex shrink-0 items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm shadow-blue-200">
              <BookOpenText size={19} />
            </span>

            <div className="hidden sm:block">
              <p className="text-sm font-semibold leading-none text-slate-950">Умнее Вместе</p>

              <p className="mt-1 text-xs text-slate-400">Кабинет ученика</p>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <StudentNavigation />
          </div>

          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
