import { z } from "zod";

export const acceptStudentInviteSchema = z.object({
  password: z
    .string()
    .min(10, "Пароль должен содержать не менее 10 символов")
    .max(128, "Пароль должен содержать не более 128 символов"),
});

export type AcceptStudentInviteFormValues = z.infer<typeof acceptStudentInviteSchema>;
