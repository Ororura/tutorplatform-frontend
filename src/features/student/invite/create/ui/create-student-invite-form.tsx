"use client";
import { Input } from "@/shared/ui/form-controls";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { ApiClientError } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";

import { useCreateStudentInviteMutation } from "../api/create-student-invite";
import { type CreateStudentInviteFormValues, createStudentInviteSchema } from "../model/create-student-invite-schema";

export function CreateStudentInviteForm({ studentId }: Readonly<{ studentId: string }>) {
  const mutation = useCreateStudentInviteMutation(studentId);
  const [copied, setCopied] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<CreateStudentInviteFormValues>({
    resolver: zodResolver(createStudentInviteSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setCopied(false);
    clearErrors("root");
    mutation.reset();
    try {
      await mutation.mutateAsync(values);
      reset();
    } catch (error) {
      if (error instanceof ApiClientError) {
        const emailError = error.body.details.find((detail) => detail.field === "email");
        if (emailError) {
          setError("email", { message: emailError.message }, { shouldFocus: true });
        }
        setError("root.server", {
          message: error.body.code === "EMAIL_ALREADY_REGISTERED" ? "Этот email уже используется" : error.body.message,
        });
        return;
      }
      setError("root.server", { message: "Не удалось создать приглашение." });
    }
  });

  const copyInviteUrl = async () => {
    if (!mutation.data) return;
    try {
      await navigator.clipboard.writeText(mutation.data.inviteUrl);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="space-y-4">
      <form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={onSubmit} noValidate>
        <div className="flex-1">
          <label className="mb-2 block text-sm font-medium" htmlFor="invite-email">
            Email ученика
          </label>
          <Input
            id="invite-email"
            type="email"
            autoComplete="email"

            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "invite-email-error" : undefined}
            {...register("email")}
          />
          {errors.email && (
            <p id="invite-email-error" className="mt-1 text-sm text-danger">
              {errors.email.message}
            </p>
          )}
        </div>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Создаём…" : "Создать приглашение"}
        </Button>
      </form>
      {errors.root?.server && (
        <p className="text-sm text-danger" role="alert">
          {errors.root.server.message}
        </p>
      )}
      {mutation.data && (
        <div className="rounded-inset border border-success-border bg-success-subtle p-4" role="status">
          <p className="font-medium text-success">Ссылка создана</p>
          <p className="mt-1 text-sm text-success">
            Сохраните её сейчас: после перезагрузки она больше не будет доступна.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Input
              className="min-w-0 flex-1"
              readOnly
              aria-label="Ссылка-приглашение"
              value={mutation.data.inviteUrl}
            />
            <button
              className="rounded-control border border-success-border px-4 py-2 text-sm font-medium text-success"
              type="button"
              onClick={copyInviteUrl}
            >
              {copied ? "Скопировано" : "Копировать"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
