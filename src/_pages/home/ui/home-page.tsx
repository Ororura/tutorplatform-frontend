import Link from "next/link";

export function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center gap-6 px-6 py-16">
      <div className="space-y-3">
        <p className="text-sm font-medium text-neutral-500">Foundation milestone</p>
        <h1 className="text-4xl font-semibold tracking-tight">Tutor Learning Platform</h1>
        <p className="max-w-2xl text-neutral-600">
          Next.js + FSD frontend is connected to a Spring Boot modular-monolith backend contract.
        </p>
      </div>
      <nav className="flex gap-4 text-sm underline underline-offset-4">
        <Link href="/login">Вход</Link>
        <Link href="/register">Регистрация преподавателя</Link>
        <Link href="/teacher/students">Ученики</Link>
      </nav>
    </main>
  );
}
