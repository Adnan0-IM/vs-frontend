// import { authClient } from "@/lib/auth-client"
// import { useQuery } from "@tanstack/react-query"

// Check if user can sign before showing the button
export function SignDocumentButton() {
  // const { data: canSign } = useQuery({
  //   queryKey: ["hasPermission", "document", "sign"],
  //   queryFn: async () => {
  //     const res = await authClient.organization.hasPermission({
  //       permissions: { document: ["sign"] },
  //     })
  //     return res
  //   },
  // })

  // if (!canSign?.success) return null

  return <button type="button"> Sign Document </button>
}

