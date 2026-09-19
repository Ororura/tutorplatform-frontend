import { z } from "zod";

export const acceptTeacherInvitationSchema = z
  .object({
    displayName: z.string().trim().min(2, "Введите имя (минимум 2 символа)").max(160, "Имя слишком длинное"),

    password: z
      .string()
      .min(10, "Пароль должен содержать не менее 10 символов")
      .max(128, "Пароль должен содержать не более 128 символов"),

    passwordConfirmation: z.string().min(1, "Повторите пароль"),
  })
  .refine((values) => values.password === values.passwordConfirmation, {
    message: "Пароли не совпадают",
    path: ["passwordConfirmation"],
  });

export type AcceptTeacherInvitationFormValues = z.infer<typeof acceptTeacherInvitationSchema>;
