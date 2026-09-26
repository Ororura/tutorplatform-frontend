"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";

import { ApiClientError } from "@/shared/api/client";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";

import { useLoginMutation } from "../api/login";
import { getPostLoginRoute } from "../model/login-routing";
import { type LoginFormValues, loginSchema } from "../model/login-schema";
import { DemoAccountHelper } from "./demo-account-helper";
import { RegistrationAvailability } from "./registration-availability";

const inputClassName =
  "h-12 w-full rounded-xl border bg-white pl-11 pr-4 text-base text-slate-900 sm:text-[0.9375rem] outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useLoginMutation();
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    clearErrors,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    shouldFocusError: true,
  });

  const onSubmit = handleSubmit(async (values) => {
    clearErrors("root");
    try {
      const user = await login.mutateAsync(values);
      const next = searchParams.get("next");
      router.replace(getPostLoginRoute(user, next));
    } catch (error) {
      if (error instanceof ApiClientError) {
        for (const detail of error.body.details) {
          if (detail.field === "email" || detail.field === "password") {
            setError(detail.field, { message: detail.message });
          }
        }
        setError("root.server", {
          message: error.body.code === "AUTH_INVALID_CREDENTIALS" ? "Неверный email или пароль" : error.body.message,
        });
        return;
      }
      setError("root.server", { message: "Не удалось выполнить вход. Попробуйте ещё раз." });
    }
  });

  return (
    <form className="mt-7 space-y-5" onSubmit={onSubmit} noValidate>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-800" htmlFor="login-email">
          Email
        </label>
        <div className="relative">
          <Mail
            className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-blue-600"
            strokeWidth={1.8}
            aria-hidden="true"
          />
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="example@domain.com"
            disabled={login.isPending}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "login-email-error" : undefined}
            className={cn(inputClassName, errors.email ? "border-red-400" : "border-slate-200")}
            {...register("email")}
          />
        </div>
        {errors.email && (
          <p id="login-email-error" className="text-sm text-red-700">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-800" htmlFor="login-password">
          Пароль
        </label>
        <div className="relative">
          <LockKeyhole
            className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-blue-600"
            strokeWidth={1.8}
            aria-hidden="true"
          />
          <input
            id="login-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Введите пароль"
            disabled={login.isPending}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "login-password-error" : undefined}
            className={cn(inputClassName, "pr-12", errors.password ? "border-red-400" : "border-slate-200")}
            {...register("password")}
          />
          <button
            className="absolute top-1/2 right-2.5 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            disabled={login.isPending}
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
        {errors.password && (
          <p id="login-password-error" className="text-sm text-red-700">
            {errors.password.message}
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
        disabled={login.isPending}
        aria-busy={login.isPending}
      >
        {login.isPending ? "Входим…" : "Войти"}
        {!login.isPending && <ArrowRight className="size-5" aria-hidden="true" />}
      </Button>

      <DemoAccountHelper
        onSelect={({ email, password }) => {
          clearErrors();
          setValue("email", email, { shouldValidate: true });
          setValue("password", password, { shouldValidate: true });
        }}
      />

      <RegistrationAvailability />
    </form>
  );
}
