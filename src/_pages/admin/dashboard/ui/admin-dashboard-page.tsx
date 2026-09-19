import Link from "next/link";

export function AdminDashboardPage() {
  return (
    <main className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6">
      <header className="border-b border-neutral-200 pb-8">
        <p className="text-sm text-neutral-500">Tutor Learning Platform / Administration</p>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Управление платформой</h1>

        <p className="mt-3 text-neutral-600">Настройки регистрации и приглашения преподавателей.</p>
      </header>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <Link
          href="/admin/settings"
          className="rounded-2xl border border-neutral-200 bg-white p-6 transition-colors hover:border-neutral-900"
        >
          <h2 className="text-lg font-semibold">Настройки регистрации</h2>

          <p className="mt-2 text-sm leading-6 text-neutral-600">
            Разрешить открытую регистрацию или ограничить создание аккаунтов приглашениями.
          </p>

          <span className="mt-6 inline-block text-sm font-medium">Открыть настройки →</span>
        </Link>

        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
          <h2 className="text-lg font-semibold">Приглашения преподавателей</h2>

          <p className="mt-2 text-sm leading-6 text-neutral-600">Создание, просмотр и отзыв приглашений.</p>

          <span className="mt-6 inline-block text-sm text-neutral-500">Добавим следующим этапом</span>
        </div>
      </section>
    </main>
  );
}
