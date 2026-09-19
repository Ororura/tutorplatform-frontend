"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { getTeacherInvitationErrorMessage } from "@/entities/teacher-invitation";

import { ApiClientError } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";

import { useAcceptTeacherInvitationMutation } from "../api/accept-teacher-invitation";

import {
  acceptTeacherInvitationSchema,
  type AcceptTeacherInvitationFormValues,
} from "../model/accept-teacher-invitation-schema";

type Props = {
  token: string;
};

export function AcceptTeacherInvitationForm({ token }: Readonly<Props>) {
  const router = useRouter();

  const mutation = useAcceptTeacherInvitationMutation(token);

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<AcceptTeacherInvitationFormValues>({
    resolver: zodResolver(acceptTeacherInvitationSchema),

    defaultValues: {
      displayName: "",
      password: "",
      passwordConfirmation: "",
    },

    shouldFocusError: true,
  });

  const onSubmit = handleSubmit(async (values) => {
    clearErrors("root");
    mutation.reset();

    try {
      await mutation.mutateAsync({
        displayName: values.displayName,
        password: values.password,
      });

      router.replace("/teacher");
    } catch (error) {
      if (error instanceof ApiClientError) {
        for (const detail of error.body.details ?? []) {
          if (detail.field === "displayName" || detail.field === "password") {
            setError(detail.field, {
              message: detail.message,
            });
          }
        }
      }

      setError("root.server", {
        message: getTeacherInvitationErrorMessage(error),
      });
    }
  });

  return (
    <form className="space-y-5" onSubmit={onSubmit} noValidate>
      <div className="space-y-2">
        <label htmlFor="teacher-invite-name" className="block text-sm font-medium">
          Как к вам обращаться?
        </label>

        <input
          id="teacher-invite-name"
          type="text"
          autoComplete="name"
          autoFocus
          aria-invalid={Boolean(errors.displayName)}
          className="h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 outline-none focus:border-neutral-900"
          {...register("displayName")}
        />

        {errors.displayName && (
          <p className="text-sm text-red-700" role="alert">
            {errors.displayName.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="teacher-invite-password" className="block text-sm font-medium">
          Придумайте пароль
        </label>

        <input
          id="teacher-invite-password"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.password)}
          className="h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 outline-none focus:border-neutral-900"
          {...register("password")}
        />

        {errors.password ? (
          <p className="text-sm text-red-700" role="alert">
            {errors.password.message}
          </p>
        ) : (
          <p className="text-sm text-neutral-500">Не менее 10 символов.</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="teacher-invite-confirmation" className="block text-sm font-medium">
          Повторите пароль
        </label>

        <input
          id="teacher-invite-confirmation"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.passwordConfirmation)}
          className="h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 outline-none focus:border-neutral-900"
          {...register("passwordConfirmation")}
        />

        {errors.passwordConfirmation && (
          <p className="text-sm text-red-700" role="alert">
            {errors.passwordConfirmation.message}
          </p>
        )}
      </div>

      {errors.root?.server && (
        <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700" role="alert">
          {errors.root.server.message}
        </p>
      )}

      {mutation.isSuccess && (
        <p className="rounded-lg bg-green-50 p-4 text-sm text-green-800" role="status">
          Аккаунт создан. Переходим в кабинет…
        </p>
      )}

      <Button
        className="h-11 w-full"
        type="submit"
        disabled={mutation.isPending || mutation.isSuccess}
        aria-busy={mutation.isPending}
      >
        {mutation.isPending ? "Создаём аккаунт…" : "Создать аккаунт преподавателя"}
      </Button>
    </form>
  );
}
