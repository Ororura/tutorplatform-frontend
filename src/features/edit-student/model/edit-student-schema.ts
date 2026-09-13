import { z } from "zod";

export const editStudentSchema = z.object({
  firstName: z.string().trim().min(1, "Введите имя").max(100, "Не более 100 символов"),
  lastName: z.string().trim().max(100, "Не более 100 символов"),
});

export type EditStudentFormValues = z.infer<typeof editStudentSchema>;
