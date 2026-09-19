export function AdminDashboardPage() {
  return (
    <main className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6">
      <div className="border-b border-neutral-200 pb-8">
        <p className="mb-3 text-sm text-neutral-500">Tutor Learning Platform / Administration</p>

        <h1 className="text-3xl font-semibold tracking-tight">Управление платформой</h1>

        <p className="mt-3 max-w-2xl text-neutral-600">
          Настройки регистрации и управление приглашениями преподавателей.
        </p>
      </div>

      <section className="py-8">
        <h2 className="text-lg font-medium">Административный кабинет</h2>

        <p className="mt-2 text-sm text-neutral-600">
          Управление регистрацией и приглашениями появится здесь на следующих этапах.
        </p>
      </section>
    </main>
  );
}
