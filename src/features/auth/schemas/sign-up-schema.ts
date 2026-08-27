import * as z from "zod"

export const signupFormSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters.")
    .max(32, "Name must be at most 32 characters."),
  email: z
    .string()
    .min(5, "Email must be at least 5 characters.")
    .email("Invalid email")
    .max(32, "Email must be at most 32 characters."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(32, "Password must be at most 32 characters."),
  confirmPassword: z
    .string()
    .min(8, "Confirm Password must be at least 8 characters."),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
})