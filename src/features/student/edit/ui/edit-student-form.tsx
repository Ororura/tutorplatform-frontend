"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import type { StudentDetails } from "@/entities/student";
import { ApiClientError } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";

import { useEditStudentMutation } from "../api/edit-student";
import { type EditStudentFormValues, editStudentSchema } from "../model/edit-student-schema";

type Props = {
  student: StudentDetails;
  onDone: () => void;
};

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
    defaultValues: {
      firstName: student.firstName,
      lastName: student.lastName ?? "",
    },
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

        setError("root.server", {
          message: error.body.message,
        });

        return;
      }

      setError("root.server", {
        message: "Не удалось сохранить изменения.",
      });
    }
  });

  return (
    <form
      className="space-y-5 rounded-[28px] border border-white/80 bg-white p-6 shadow-[0_12px_40px_rgba(45,79,135,0.06)]"
      onSubmit={onSubmit}
      noValidate
    >
      <div>
        <p className="text-sm font-medium text-blue-600">Редактирование</p>

        <h2 className="mt-1 text-xl font-semibold text-slate-950">Данные ученика</h2>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="edit-student-first-name">
          Имя
        </label>

        <input
          id="edit-student-first-name"
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
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
        <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="edit-student-last-name">
          Фамилия
        </label>

        <input
          id="edit-student-last-name"
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
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

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Сохраняем…" : "Сохранить"}
        </Button>

        <Button variant="secondary" type="button" onClick={onDone}>
          Отмена
        </Button>
      </div>
    </form>
  );
}
