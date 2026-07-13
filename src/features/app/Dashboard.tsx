import { authClient } from "@/lib/auth-client"
import Layout from "./components/Layout"
import OrgSetup from "./OrgSetup"

const Dashboard = () => {
  const { data: organizations, isPending } = authClient.useListOrganizations()

  if (isPending) {
    return (
      <Layout>
        <div className="flex h-full w-full items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Loading organizations...
          </p>
        </div>
      </Layout>
    )
  }

  if (!organizations || organizations.length === 0) {
    return <OrgSetup />
  }
  return (
    <Layout>
      <div className="flex h-full w-full items-center justify-center">
        {organizations.map((org) => (
          <div key={org.id} className="flex flex-col items-center gap-2">
            <p className="text-sm font-medium text-muted-foreground">
              Organization: {org.name}
            </p>
          </div>
        ))}
      </div>
    </Layout>
  )
}

export default Dashboard
