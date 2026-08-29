import { createAuthClient } from "better-auth/react"
import { organizationClient } from "better-auth/client/plugins"
import { ac, orgMember, orgAdmin, orgOwner } from "./permissions.ts"
import { BACKEND_URL } from "@/constants.ts"

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_AUTH_ORIGIN ?? BACKEND_URL,
  basePath: "/api/auth",
  plugins: [
    organizationClient({
      ac,
      roles: { owner: orgOwner, admin: orgAdmin, member: orgMember },
    }),
  ],
})

export type Session = typeof authClient.$Infer.Session
