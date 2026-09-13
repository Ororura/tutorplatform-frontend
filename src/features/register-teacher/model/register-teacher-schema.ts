import { z } from "zod";

export const registerTeacherSchema = z
  .object({
    displayName: z.string().trim().min(2, "Введите имя (минимум 2 символа)").max(160),
    email: z.string().trim().min(1, "Введите email").email("Введите корректный email").max(320),
    password: z.string().min(10, "Пароль должен содержать не менее 10 символов").max(128),
    passwordConfirmation: z.string().min(1, "Повторите пароль"),
  })
  .refine((values) => values.password === values.passwordConfirmation, {
    message: "Пароли не совпадают",
    path: ["passwordConfirmation"],
  });

export type RegisterTeacherFormValues = z.infer<typeof registerTeacherSchema>;
