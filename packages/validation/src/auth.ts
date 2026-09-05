import { z } from "zod";

// Kept in one place and reused by both the API (server-side validation)
// and the web app (client-side validation with react-hook-form), so the
// rules can never drift between frontend and backend.

export const passwordSchema = z
  .string()
  .min(8, "Your password must contain at least 8 characters.")
  .max(72, "Your password must be 72 characters or fewer.")
  .regex(/[a-z]/, "Include at least one lowercase letter.")
  .regex(/[A-Z]/, "Include at least one uppercase letter.")
  .regex(/[0-9]/, "Include at least one number.");

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Your name must be at least 2 characters.")
    .max(80, "Your name must be 80 characters or fewer."),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: passwordSchema,
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});
export type LoginInput = z.infer<typeof loginSchema>;
