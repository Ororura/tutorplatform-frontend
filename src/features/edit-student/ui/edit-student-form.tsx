"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import type { StudentDetails } from "@/entities/student";
import { ApiClientError } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";

import { useEditStudentMutation } from "../api/edit-student";
import { type EditStudentFormValues, editStudentSchema } from "../model/edit-student-schema";

type Props = { student: StudentDetails; onDone: () => void };

export function EditStudentForm({ student, onDone }: Readonly<Props>) {
  const mutation = useEditStudentMutation(student.id);
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<EditStudentFormValues>({
    resolver: zodResolver(editStudentSchema),
    defaultValues: { firstName: student.firstName, lastName: student.lastName ?? "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    clearErrors("root");
    try {
      await mutation.mutateAsync({
        firstName: values.firstName,
        lastName: values.lastName || undefined,
      });
      onDone();
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
      setError("root.server", { message: "Не удалось сохранить изменения." });
    }
  });

  return (
    <form className="space-y-4 rounded-lg border border-neutral-200 bg-neutral-50 p-5" onSubmit={onSubmit} noValidate>
      <div>
        <label className="mb-2 block text-sm font-medium" htmlFor="edit-student-first-name">
          Имя
        </label>
        <input
          id="edit-student-first-name"
          className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3"
          aria-invalid={Boolean(errors.firstName)}
          aria-describedby={errors.firstName ? "edit-student-first-name-error" : undefined}
          {...register("firstName")}
        />
        {errors.firstName && (
          <p id="edit-student-first-name-error" className="mt-1 text-sm text-red-700">
            {errors.firstName.message}
          </p>
        )}
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium" htmlFor="edit-student-last-name">
          Фамилия
        </label>
        <input
          id="edit-student-last-name"
          className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3"
          aria-invalid={Boolean(errors.lastName)}
          aria-describedby={errors.lastName ? "edit-student-last-name-error" : undefined}
          {...register("lastName")}
        />
        {errors.lastName && (
          <p id="edit-student-last-name-error" className="mt-1 text-sm text-red-700">
            {errors.lastName.message}
          </p>
        )}
      </div>
      {errors.root?.server && (
        <p className="text-sm text-red-700" role="alert">
          {errors.root.server.message}
        </p>
      )}
      <div className="flex gap-3">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Сохраняем…" : "Сохранить"}
        </Button>
        <button className="rounded-md border border-neutral-300 px-4 text-sm" type="button" onClick={onDone}>
          Отмена
        </button>
      </div>
    </form>
  );
}
