import { authClient } from "@/lib/auth-client"

export function OrganizationSelector() {
  const { data: organizations } = authClient.useListOrganizations()
  const { data: activeOrg } = authClient.useActiveOrganization()

  const setActive = async (orgId: string) => {
    await authClient.organization.setActive({ organizationId: orgId })
  }

  const activeOrgId = activeOrg?.id ?? ""

  return (
    <div className="relative w-56">
      <select
        value={activeOrgId}
        onChange={(e) => setActive(e.target.value)}
        className="h-9 w-full cursor-pointer rounded-md border border-input bg-transparent px-2.5 text-sm outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <option value="" disabled>
          Select organization
        </option>
        {organizations?.map((org: { id: string; name: string }) => (
          <option key={org.id} value={org.id}>
            {org.name}
          </option>
        ))}
      </select>
    </div>
  )
}
