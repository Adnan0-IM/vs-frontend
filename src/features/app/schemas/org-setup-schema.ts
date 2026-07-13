import * as z from "zod"

export const orgSetupSchema = z.object({
  organizationName: z
    .string()
    .min(2, "Organization name must be at least 2 characters.")
    .max(80, "Organization name must be at most 80 characters."),
  organizationType: z.enum([
    "university",
    "secondary-school",
    "government-agency",
    "company",
    "other",
  ]),
  organizationLogo: z
    .instanceof(FileList)
    .optional()
    .refine(
      (files) => !files || files.length === 0 || files[0] instanceof File,
      {
        message: "Please upload a valid image file.",
      }
    ),
})

export type OrgSetupFormValues = z.infer<typeof orgSetupSchema>
