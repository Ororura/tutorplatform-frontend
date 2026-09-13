"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { ApiClientError } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";

import { useCreateStudentMutation } from "../api/create-student";
import { createStudentSchema, type CreateStudentFormValues } from "../model/create-student-schema";

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
    <form className="grid gap-4 rounded-lg border border-neutral-200 bg-white p-5 sm:grid-cols-2" onSubmit={onSubmit} noValidate>
      <div className="space-y-2">
        <label className="block text-sm font-medium" htmlFor="create-student-first-name">Имя</label>
        <input
          autoFocus
          id="create-student-first-name"
          className="h-10 w-full rounded-md border border-neutral-300 px-3 outline-none focus:ring-2 focus:ring-neutral-300"
          aria-invalid={Boolean(errors.firstName)}
          aria-describedby={errors.firstName ? "create-student-first-name-error" : undefined}
          {...register("firstName")}
        />
        {errors.firstName && <p id="create-student-first-name-error" className="text-sm text-red-700">{errors.firstName.message}</p>}
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium" htmlFor="create-student-last-name">Фамилия</label>
        <input
          id="create-student-last-name"
          className="h-10 w-full rounded-md border border-neutral-300 px-3 outline-none focus:ring-2 focus:ring-neutral-300"
          aria-invalid={Boolean(errors.lastName)}
          aria-describedby={errors.lastName ? "create-student-last-name-error" : undefined}
          {...register("lastName")}
        />
        {errors.lastName && <p id="create-student-last-name-error" className="text-sm text-red-700">{errors.lastName.message}</p>}
      </div>
      {errors.root?.server && <p className="text-sm text-red-700 sm:col-span-2" role="alert">{errors.root.server.message}</p>}
      {mutation.isSuccess && <p className="text-sm text-green-700 sm:col-span-2" role="status">Ученик создан.</p>}
      <div className="sm:col-span-2">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Создаём…" : "Добавить ученика"}
        </Button>
      </div>
    </form>
  );
}
