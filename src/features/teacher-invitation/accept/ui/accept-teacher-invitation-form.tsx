"use client";
import { Input } from "@/shared/ui/form-controls";

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
        <label htmlFor="teacher-invite-name" className="field-label">
          Как к вам обращаться?
        </label>

        <Input
          id="teacher-invite-name"
          type="text"
          autoComplete="name"
          autoFocus
          aria-invalid={Boolean(errors.displayName)}

          {...register("displayName")}
        />

        {errors.displayName && (
          <p className="text-sm text-danger" role="alert">
            {errors.displayName.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="teacher-invite-password" className="field-label">
          Придумайте пароль
        </label>

        <Input
          id="teacher-invite-password"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.password)}

          {...register("password")}
        />

        {errors.password ? (
          <p className="text-sm text-danger" role="alert">
            {errors.password.message}
          </p>
        ) : (
          <p className="text-sm text-foreground-muted">Не менее 10 символов.</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="teacher-invite-confirmation" className="field-label">
          Повторите пароль
        </label>

        <Input
          id="teacher-invite-confirmation"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.passwordConfirmation)}

          {...register("passwordConfirmation")}
        />

        {errors.passwordConfirmation && (
          <p className="text-sm text-danger" role="alert">
            {errors.passwordConfirmation.message}
          </p>
        )}
      </div>

      {errors.root?.server && (
        <p className="rounded-inset bg-danger-subtle p-4 text-sm text-danger" role="alert">
          {errors.root.server.message}
        </p>
      )}

      {mutation.isSuccess && (
        <p className="rounded-inset bg-success-subtle p-4 text-sm text-success" role="status">
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
