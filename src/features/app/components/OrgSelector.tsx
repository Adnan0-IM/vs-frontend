import { authClient } from "@/lib/auth-client"

{
  /* // List user's organizations */
}
export function OrganizationSelector() {
  const { data: organizations } = authClient.useListOrganizations()
  const { data: activeOrg } = authClient.useActiveOrganization()

  const setActive = async (orgId: string) => {
    await authClient.organization.setActive({ organizationId: orgId })
  }

  return (
    <select value={activeOrg?.id} onChange={(e) => setActive(e.target.value)}>
      {organizations?.map((org: { id: string; name: string }) => (
        <option key={org.id} value={org.id}>
          {" "}
          {org.name}{" "}
        </option>
      ))}
    </select>
  )
}
