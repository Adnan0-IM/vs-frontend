import * as z from "zod"

export const signinFormSchema = z.object({
  email: z
    .string()
    .min(5, "Email must be at least 5 characters.")
    .email("Invalid email")
    .max(32, "Email must be at most 32 characters."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(32, "Password must be at most 32 characters."),
})
