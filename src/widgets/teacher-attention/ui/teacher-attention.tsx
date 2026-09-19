import { CircleAlert } from "lucide-react";

export function TeacherAttention() {
  return (
    <section className="rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_12px_40px_rgba(45,79,135,0.06)] sm:p-6">
      <div className="flex items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
          <CircleAlert size={20} />
        </span>

        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">Требует внимания</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Сводка по работам пока недоступна: текущий API не позволяет получить ожидающие проверки и просроченные
            домашние задания без отдельных запросов по каждому ученику.
          </p>
        </div>
      </div>
    </section>
  );
}
