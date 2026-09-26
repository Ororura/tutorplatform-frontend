"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { ApiClientError } from "@/shared/api/client";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";

import { useRegisterTeacherMutation } from "../api/register-teacher";
import { type RegisterTeacherFormValues, registerTeacherSchema } from "../model/register-teacher-schema";

const inputClassName =
  "h-12 w-full rounded-xl border bg-white pl-11 pr-4 text-base text-slate-900 sm:text-[0.9375rem] outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";

export function RegisterTeacherForm() {
  const router = useRouter();
  const registration = useRegisterTeacherMutation();
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<RegisterTeacherFormValues>({
    resolver: zodResolver(registerTeacherSchema),
    defaultValues: { displayName: "", email: "", password: "", passwordConfirmation: "" },
    shouldFocusError: true,
  });

  const onSubmit = handleSubmit(async (formValues) => {
    clearErrors("root");
    try {
      const values = {
        displayName: formValues.displayName,
        email: formValues.email,
        password: formValues.password,
      };
      await registration.mutateAsync(values);
      router.replace("/teacher/students");
    } catch (error) {
      if (error instanceof ApiClientError) {
        for (const detail of error.body.details) {
          if (detail.field === "displayName" || detail.field === "email" || detail.field === "password") {
            setError(detail.field, { message: detail.message });
          }
        }
        setError("root.server", {
          message:
            error.body.code === "EMAIL_ALREADY_REGISTERED"
              ? "Аккаунт с таким email уже существует"
              : error.body.code === "REGISTRATION_INVITE_REQUIRED"
                ? "Регистрация теперь доступна только по приглашению. Попросите администратора платформы создать для вас ссылку."
                : error.body.message,
        });
        return;
      }
      setError("root.server", { message: "Не удалось зарегистрироваться. Попробуйте ещё раз." });
    }
  });

  return (
    <form className="mt-7 space-y-5" onSubmit={onSubmit} noValidate>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-800" htmlFor="register-displayName">
          Имя
        </label>
        <div className="relative">
          <UserRound
            className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-blue-600"
            strokeWidth={1.8}
            aria-hidden="true"
          />
          <input
            id="register-displayName"
            type="text"
            autoComplete="name"
            autoFocus
            placeholder="Как к вам обращаться"
            disabled={registration.isPending}
            aria-invalid={Boolean(errors.displayName)}
            aria-describedby={errors.displayName ? "register-displayName-error" : undefined}
            className={cn(inputClassName, errors.displayName ? "border-red-400" : "border-slate-200")}
            {...register("displayName")}
          />
        </div>
        {errors.displayName && (
          <p id="register-displayName-error" className="text-sm text-red-700">
            {errors.displayName.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-800" htmlFor="register-email">
          Email
        </label>
        <div className="relative">
          <Mail
            className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-blue-600"
            strokeWidth={1.8}
            aria-hidden="true"
          />
          <input
            id="register-email"
            type="email"
            autoComplete="email"
            placeholder="example@domain.com"
            disabled={registration.isPending}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "register-email-error" : undefined}
            className={cn(inputClassName, errors.email ? "border-red-400" : "border-slate-200")}
            {...register("email")}
          />
        </div>
        {errors.email && (
          <p id="register-email-error" className="text-sm text-red-700">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-800" htmlFor="register-password">
          Пароль
        </label>
        <div className="relative">
          <LockKeyhole
            className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-blue-600"
            strokeWidth={1.8}
            aria-hidden="true"
          />
          <input
            id="register-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Минимум 10 символов"
            disabled={registration.isPending}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "register-password-error" : "register-password-help"}
            className={cn(inputClassName, "pr-12", errors.password ? "border-red-400" : "border-slate-200")}
            {...register("password")}
          />
          <button
            className="absolute top-1/2 right-2.5 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            disabled={registration.isPending}
            aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
            aria-pressed={showPassword}
            onClick={() => setShowPassword((isVisible) => !isVisible)}
          >
            {showPassword ? (
              <EyeOff className="size-5" strokeWidth={1.8} aria-hidden="true" />
            ) : (
              <Eye className="size-5" strokeWidth={1.8} aria-hidden="true" />
            )}
          </button>
        </div>
        {errors.password ? (
          <p id="register-password-error" className="text-sm text-red-700">
            {errors.password.message}
          </p>
        ) : (
          <p id="register-password-help" className="text-xs text-slate-500">
            Используйте не менее 10 символов.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-800" htmlFor="register-passwordConfirmation">
          Повторите пароль
        </label>
        <div className="relative">
          <LockKeyhole
            className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-blue-600"
            strokeWidth={1.8}
            aria-hidden="true"
          />
          <input
            id="register-passwordConfirmation"
            type={showPasswordConfirmation ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Введите пароль ещё раз"
            disabled={registration.isPending}
            aria-invalid={Boolean(errors.passwordConfirmation)}
            aria-describedby={errors.passwordConfirmation ? "register-passwordConfirmation-error" : undefined}
            className={cn(
              inputClassName,
              "pr-12",
              errors.passwordConfirmation ? "border-red-400" : "border-slate-200",
            )}
            {...register("passwordConfirmation")}
          />
          <button
            className="absolute top-1/2 right-2.5 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            disabled={registration.isPending}
            aria-label={showPasswordConfirmation ? "Скрыть повтор пароля" : "Показать повтор пароля"}
            aria-pressed={showPasswordConfirmation}
            onClick={() => setShowPasswordConfirmation((isVisible) => !isVisible)}
          >
            {showPasswordConfirmation ? (
              <EyeOff className="size-5" strokeWidth={1.8} aria-hidden="true" />
            ) : (
              <Eye className="size-5" strokeWidth={1.8} aria-hidden="true" />
            )}
          </button>
        </div>
        {errors.passwordConfirmation && (
          <p id="register-passwordConfirmation-error" className="text-sm text-red-700">
            {errors.passwordConfirmation.message}
          </p>
        )}
      </div>

      {errors.root?.server && (
        <p className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-800" role="alert" tabIndex={-1}>
          {errors.root.server.message}
        </p>
      )}

      <Button
        className="h-12 w-full gap-2 rounded-xl bg-blue-600 text-base shadow-lg shadow-blue-200/80 hover:bg-blue-700"
        type="submit"
        disabled={registration.isPending}
        aria-busy={registration.isPending}
      >
        {registration.isPending ? "Создаём аккаунт…" : "Зарегистрироваться"}
        {!registration.isPending && <ArrowRight className="size-5" aria-hidden="true" />}
      </Button>

      <p className="text-center text-sm text-slate-500">
        Уже есть аккаунт?{" "}
        <Link
          className="font-semibold text-blue-600 transition hover:text-blue-700 focus-visible:rounded focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
          href="/login"
        >
          Войти
        </Link>
      </p>
    </form>
  );
}
