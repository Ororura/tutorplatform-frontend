import { RegisterTeacherForm } from "@/features/register-teacher";

export function TeacherRegisterPage() {
  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Регистрация преподавателя</h1>
      <p className="mt-3 text-neutral-600">Создайте аккаунт, чтобы начать работу с учениками.</p>
      <RegisterTeacherForm />
    </main>
  );
}
