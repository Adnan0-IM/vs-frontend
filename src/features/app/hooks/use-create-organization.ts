import { useMutation } from "@tanstack/react-query"
import { useUploadThing } from "@/uploadthing"
import { createOrganization } from "../api/organization"
import type { OrgSetupFormValues } from "../schemas/org-setup-schema"

export function useCreateOrganization() {
  const { startUpload } = useUploadThing("imageUploader")

  return useMutation({
    mutationFn: async (values: OrgSetupFormValues) => {
      let logoUrl: string | undefined = undefined

      const files = values.organizationLogo
      const file = files && files.length > 0 ? files[0] : null

      if (file) {
        const uploadRes = await startUpload([file])
        if (uploadRes && uploadRes[0]) {
          logoUrl = uploadRes[0].url
        }
      }

      return createOrganization(values, logoUrl)
    },
  })
}

