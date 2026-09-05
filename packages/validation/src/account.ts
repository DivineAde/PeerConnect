import { z } from "zod";

export const updateAccountSchema = z.object({
  name: z.string().trim().min(2, "Your name must be at least 2 characters.").max(80).optional(),
  headline: z.string().trim().max(120, "Keep your headline under 120 characters.").optional().nullable(),
  bio: z.string().trim().max(600, "Keep your bio under 600 characters.").optional().nullable(),
  location: z.string().trim().max(120).optional().nullable(),
  avatarUrl: z.string().trim().url("Enter a valid URL.").optional().nullable().or(z.literal("")),
});
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
