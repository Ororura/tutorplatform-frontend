import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Введите email").email("Введите корректный email").max(320),
  password: z.string().min(10, "Пароль должен содержать не менее 10 символов").max(128),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
