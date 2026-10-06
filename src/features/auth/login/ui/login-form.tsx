"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";

import { ApiClientError } from "@/shared/api/client";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/form-controls";

import { useLoginMutation } from "../api/login";
import { getPostLoginRoute } from "../model/login-routing";
import { type LoginFormValues, loginSchema } from "../model/login-schema";
import { DemoAccountHelper } from "./demo-account-helper";
import { RegistrationAvailability } from "./registration-availability";

const inputClassName = "pl-11 pr-4";

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
        <label className="field-label" htmlFor="login-email">
          Email
        </label>
        <div className="relative">
          <Mail
            className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-primary"
            strokeWidth={1.8}
            aria-hidden="true"
          />
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="example@domain.com"
            disabled={login.isPending}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "login-email-error" : undefined}
            className={cn(inputClassName)}
            {...register("email")}
          />
        </div>
        {errors.email && (
          <p id="login-email-error" className="text-sm text-danger">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="field-label" htmlFor="login-password">
          Пароль
        </label>
        <div className="relative">
          <LockKeyhole
            className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-primary"
            strokeWidth={1.8}
            aria-hidden="true"
          />
          <Input
            id="login-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Введите пароль"
            disabled={login.isPending}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "login-password-error" : undefined}
            className={cn(inputClassName, "pr-12")}
            {...register("password")}
          />
          <button
            className="absolute top-1/2 right-0 grid size-11 -translate-y-1/2 place-items-center rounded-control text-foreground-muted transition-colors hover:bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-50"
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
          <p id="login-password-error" className="text-sm text-danger">
            {errors.password.message}
          </p>
        )}
      </div>

      {errors.root?.server && (
        <p
          className="rounded-surface border border-danger-border bg-danger-subtle p-3 text-sm text-danger"
          role="alert"
          tabIndex={-1}
        >
          {errors.root.server.message}
        </p>
      )}

      <Button className="w-full" type="submit" disabled={login.isPending} aria-busy={login.isPending}>
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
