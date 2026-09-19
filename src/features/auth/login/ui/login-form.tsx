"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";

import { ApiClientError } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";

import { useLoginMutation } from "../api/login";
import { getPostLoginRoute } from "../model/login-routing";
import { type LoginFormValues, loginSchema } from "../model/login-schema";
import { DemoAccountHelper } from "./demo-account-helper";
import { RegistrationAvailability } from "./registration-availability";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useLoginMutation();
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
    <form className="mt-8 space-y-5" onSubmit={onSubmit} noValidate>
      <div className="space-y-2">
        <label className="block text-sm font-medium" htmlFor="login-email">
          Email
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          autoFocus
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "login-email-error" : undefined}
          className="h-11 w-full rounded-md border border-neutral-300 bg-white px-3 outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-300"
          {...register("email")}
        />
        {errors.email && (
          <p id="login-email-error" className="text-sm text-red-700">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium" htmlFor="login-password">
          Пароль
        </label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? "login-password-error" : undefined}
          className="h-11 w-full rounded-md border border-neutral-300 bg-white px-3 outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-300"
          {...register("password")}
        />
        {errors.password && (
          <p id="login-password-error" className="text-sm text-red-700">
            {errors.password.message}
          </p>
        )}
      </div>

      {errors.root?.server && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-800" role="alert" tabIndex={-1}>
          {errors.root.server.message}
        </p>
      )}

      <Button className="w-full" type="submit" disabled={login.isPending} aria-busy={login.isPending}>
        {login.isPending ? "Входим…" : "Войти"}
      </Button>

      <DemoAccountHelper
        onSelect={({ email, password }) => {
          setValue("email", email, { shouldValidate: true });
          setValue("password", password, { shouldValidate: true });
        }}
      />

      <RegistrationAvailability />
    </form>
  );
}
