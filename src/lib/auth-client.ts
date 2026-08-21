import { createAuthClient } from "better-auth/react"
import {
  inferOrgAdditionalFields,
  organizationClient,
} from "better-auth/client/plugins"
import { ac, orgMember, orgAdmin, orgOwner } from "./permissions.ts"
import type { auth } from "../../../vs-backend/src/lib/auth"

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_AUTH_ORIGIN ?? window.location.origin,
  basePath: "/api/auth",
  plugins: [
    organizationClient({
      schema: inferOrgAdditionalFields<typeof auth>(),
      ac,
      roles: { owner: orgOwner, admin: orgAdmin, member: orgMember },
    }),
  ],
})

export type Session = typeof authClient.$Infer.Session
