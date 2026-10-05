"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { getStudentInviteErrorMessage } from "@/entities/student-invite";
import { ApiClientError } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/form-controls";

import { useAcceptStudentInviteMutation } from "../api/accept-student-invite";
import { type AcceptStudentInviteFormValues, acceptStudentInviteSchema } from "../model/accept-student-invite-schema";

export function AcceptStudentInviteForm({ token }: Readonly<{ token: string }>) {
  const router = useRouter();
  const mutation = useAcceptStudentInviteMutation(token);
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<AcceptStudentInviteFormValues>({
    resolver: zodResolver(acceptStudentInviteSchema),
    defaultValues: { password: "" },
    shouldFocusError: true,
  });

  const onSubmit = handleSubmit(async (values) => {
    clearErrors("root");
    mutation.reset();

    try {
      await mutation.mutateAsync(values);
      router.replace("/student");
    } catch (error) {
      if (error instanceof ApiClientError) {
        const passwordError = error.body.details.find((detail) => detail.field === "password");
        if (passwordError) {
          setError("password", { message: passwordError.message }, { shouldFocus: true });
        }
      }

      setError("root.server", { message: getStudentInviteErrorMessage(error) });
    }
  });

  return (
    <form className="space-y-5" onSubmit={onSubmit} noValidate>
      <div className="space-y-2">
        <label className="field-label" htmlFor="student-password">
          Придумайте пароль
        </label>
        <Input
          id="student-password"
          type="password"
          autoComplete="new-password"
          autoFocus
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? "student-password-error" : "student-password-hint"}
          {...register("password")}
        />
        {errors.password ? (
          <p id="student-password-error" className="text-sm text-danger">
            {errors.password.message}
          </p>
        ) : (
          <p id="student-password-hint" className="text-sm text-foreground-muted">
            Не менее 10 символов.
          </p>
        )}
      </div>

      {errors.root?.server && (
        <p className="rounded-control bg-danger-subtle p-3 text-sm text-danger" role="alert">
          {errors.root.server.message}
        </p>
      )}

      {mutation.isSuccess && (
        <p className="rounded-control bg-success-subtle p-3 text-sm text-success" role="status">
          Приглашение принято. Переходим в аккаунт…
        </p>
      )}

      <Button
        className="w-full"
        type="submit"
        disabled={mutation.isPending || mutation.isSuccess}
        aria-busy={mutation.isPending}
      >
        {mutation.isPending ? "Создаём аккаунт…" : "Принять приглашение"}
      </Button>
    </form>
  );
}
