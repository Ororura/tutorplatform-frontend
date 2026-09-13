import { z } from "zod";

export const createStudentInviteSchema = z.object({
  email: z.string().trim().min(1, "Введите email").email("Введите корректный email").max(320),
});

export type CreateStudentInviteFormValues = z.infer<typeof createStudentInviteSchema>;
