import { z } from "zod";

export const createStudentSchema = z.object({
  firstName: z.string().trim().min(1, "Введите имя").max(100, "Не более 100 символов"),
  lastName: z.string().trim().max(100, "Не более 100 символов"),
});

export type CreateStudentFormValues = z.infer<typeof createStudentSchema>;
