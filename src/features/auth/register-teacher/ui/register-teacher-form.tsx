"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { ApiClientError } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";

import { useRegisterTeacherMutation } from "../api/register-teacher";
import { type RegisterTeacherFormValues, registerTeacherSchema } from "../model/register-teacher-schema";

const fields = [
  { name: "displayName", label: "Имя", type: "text", autoComplete: "name" },
  { name: "email", label: "Email", type: "email", autoComplete: "email" },
  { name: "password", label: "Пароль", type: "password", autoComplete: "new-password" },
  {
    name: "passwordConfirmation",
    label: "Повторите пароль",
    type: "password",
    autoComplete: "new-password",
  },
] as const;

export function RegisterTeacherForm() {
  const router = useRouter();
  const registration = useRegisterTeacherMutation();
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
    <form className="mt-8 space-y-5" onSubmit={onSubmit} noValidate>
      {fields.map((field, index) => {
        const error = errors[field.name];
        const id = `register-${field.name}`;
        return (
          <div className="space-y-2" key={field.name}>
            <label className="block text-sm font-medium" htmlFor={id}>
              {field.label}
            </label>
            <input
              id={id}
              type={field.type}
              autoComplete={field.autoComplete}
              autoFocus={index === 0}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? `${id}-error` : undefined}
              className="h-11 w-full rounded-md border border-neutral-300 bg-white px-3 outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-300"
              {...register(field.name)}
            />
            {error && (
              <p id={`${id}-error`} className="text-sm text-red-700">
                {error.message}
              </p>
            )}
          </div>
        );
      })}

      {errors.root?.server && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-800" role="alert" tabIndex={-1}>
          {errors.root.server.message}
        </p>
      )}

      <Button className="w-full" type="submit" disabled={registration.isPending} aria-busy={registration.isPending}>
        {registration.isPending ? "Создаём аккаунт…" : "Зарегистрироваться"}
      </Button>

      <p className="text-sm text-neutral-600">
        Уже есть аккаунт?{" "}
        <Link className="font-medium text-neutral-900 underline underline-offset-4" href="/login">
          Войти
        </Link>
      </p>
    </form>
  );
}
