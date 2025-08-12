import { z } from "zod";

export const weightEntrySchema = z.object({
  date: z.string().min(1, "Date is required"),
  weight: z
    .string()
    .refine((v) => !Number.isNaN(parseFloat(v)), "Weight must be a number"),
});

export type WeightEntryValues = z.infer<typeof weightEntrySchema>;
