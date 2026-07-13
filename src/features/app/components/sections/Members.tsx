import Layout from "../components/Layout"

const Members = () => {
  return (
    <Layout>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-6 md:px-8 md:py-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Members</h1>
          <p className="max-w-2xl text-muted-foreground">
            Invite teammates, review access, and manage membership.
          </p>
        </div>
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
          This is a placeholder for the admin section. You can add your admin
          components here.
        </div>
      </div>
    </Layout>
  )
}

export default Members
