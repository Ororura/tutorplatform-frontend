"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { getStudentInviteErrorMessage } from "@/entities/student-invite";
import { ApiClientError } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";

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
        <label className="block text-sm font-medium" htmlFor="student-password">
          Придумайте пароль
        </label>
        <input
          id="student-password"
          type="password"
          autoComplete="new-password"
          autoFocus
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? "student-password-error" : "student-password-hint"}
          className="h-11 w-full rounded-md border border-neutral-300 bg-white px-3 outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-300"
          {...register("password")}
        />
        {errors.password ? (
          <p id="student-password-error" className="text-sm text-red-700">
            {errors.password.message}
          </p>
        ) : (
          <p id="student-password-hint" className="text-sm text-neutral-500">
            Не менее 10 символов.
          </p>
        )}
      </div>

      {errors.root?.server && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-800" role="alert">
          {errors.root.server.message}
        </p>
      )}

      {mutation.isSuccess && (
        <p className="rounded-md bg-green-50 p-3 text-sm text-green-800" role="status">
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
