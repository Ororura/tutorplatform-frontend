"use client";
import { Input } from "@/shared/ui/form-controls";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { ApiClientError } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";

import { useCreateStudentMutation } from "../api/create-student";
import { type CreateStudentFormValues, createStudentSchema } from "../model/create-student-schema";

export function CreateStudentForm({ onSuccess }: Readonly<{ onSuccess?: () => void }>) {
  const mutation = useCreateStudentMutation();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<CreateStudentFormValues>({
    resolver: zodResolver(createStudentSchema),
    defaultValues: { firstName: "", lastName: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    clearErrors("root");
    try {
      await mutation.mutateAsync({
        firstName: values.firstName,
        lastName: values.lastName || undefined,
      });
      reset();
      onSuccess?.();
    } catch (error) {
      if (error instanceof ApiClientError) {
        for (const detail of error.body.details) {
          if (detail.field === "firstName" || detail.field === "lastName") {
            setError(detail.field, { message: detail.message }, { shouldFocus: true });
          }
        }
        setError("root.server", { message: error.body.message });
        return;
      }
      setError("root.server", { message: "Не удалось создать ученика." });
    }
  });

  return (
    <form
      className="grid gap-4 rounded-inset border border-border bg-surface p-5 sm:grid-cols-2"
      onSubmit={onSubmit}
      noValidate
    >
      <div className="space-y-2">
        <label className="field-label" htmlFor="create-student-first-name">
          Имя
        </label>
        <Input
          autoFocus
          id="create-student-first-name"

          aria-invalid={Boolean(errors.firstName)}
          aria-describedby={errors.firstName ? "create-student-first-name-error" : undefined}
          {...register("firstName")}
        />
        {errors.firstName && (
          <p id="create-student-first-name-error" className="text-sm text-danger">
            {errors.firstName.message}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <label className="field-label" htmlFor="create-student-last-name">
          Фамилия
        </label>
        <Input
          id="create-student-last-name"

          aria-invalid={Boolean(errors.lastName)}
          aria-describedby={errors.lastName ? "create-student-last-name-error" : undefined}
          {...register("lastName")}
        />
        {errors.lastName && (
          <p id="create-student-last-name-error" className="text-sm text-danger">
            {errors.lastName.message}
          </p>
        )}
      </div>
      {errors.root?.server && (
        <p className="text-sm text-danger sm:col-span-2" role="alert">
          {errors.root.server.message}
        </p>
      )}
      {mutation.isSuccess && (
        <p className="text-sm text-success sm:col-span-2" role="status">
          Ученик создан.
        </p>
      )}
      <div className="sm:col-span-2">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Создаём…" : "Добавить ученика"}
        </Button>
      </div>
    </form>
  );
}
