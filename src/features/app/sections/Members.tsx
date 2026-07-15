import Layout from "../components/Layout"
import { authClient } from "@/lib/auth-client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  UserGroupIcon,
  MailSendIcon,
  Cancel01Icon,
  Loading03Icon,
  Delete02Icon,
  UserCheck01Icon,
  UserAdd01Icon
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"
import { useQuery } from "@tanstack/react-query"

const availableRoles = [
  { value: "admin", label: "Admin (Full settings, issue/revoke, manage keys)" },
  { value: "signer", label: "Signer (Issue/sign credentials only)" },
  { value: "viewer", label: "Viewer (Read-only dashboard access)" },
]

const Members = () => {
  const { data: activeOrg } = authClient.useActiveOrganization()
  const { data: activeMember } = authClient.useActiveMember()
  
  // Fetch members using React Query
  const { data: membersResponse, isPending: membersPending, refetch: refetchMembers } = useQuery({
    queryKey: ["orgMembers", activeOrg?.id],
    queryFn: async () => {
      const res = await authClient.organization.listMembers()
      if (res.error) throw res.error
      return res.data
    },
    enabled: !!activeOrg?.id,
  })

  const members = membersResponse?.members || []

  // Fetch invitations using React Query
  const { data: invitations = [], isPending: invitationsPending, refetch: refetchInvitations } = useQuery({
    queryKey: ["orgInvitations", activeOrg?.id],
    queryFn: async () => {
      const res = await authClient.organization.listInvitations()
      if (res.error) throw res.error
      return res.data || []
    },
    enabled: !!activeOrg?.id,
  })

  const [email, setEmail] = useState("")
  const [role, setRole] = useState<"admin" | "signer" | "viewer">("viewer")
  const [isInviting, setIsInviting] = useState(false)
  const [isCancelingInvitation, setIsCancelingInvitation] = useState<string | null>(null)

  // Roles permission check
  const currentUserRole = activeMember?.role
  const canInvite = currentUserRole === "owner" || currentUserRole === "admin"
  
  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setIsInviting(true)
    const toastId = toast.loading("Sending invitation...")
    try {
      await authClient.organization.inviteMember({
        email: email.trim(),
        role: role,
      })
      toast.success("Invitation sent successfully!", { id: toastId })
      setEmail("")
      setRole("viewer")
      refetchInvitations()
    } catch (err: any) {
      toast.error(err.message || "Failed to send invitation.", { id: toastId })
    } finally {
      setIsInviting(false)
    }
  }

  const handleCancelInvitation = async (invitationId: string) => {
    setIsCancelingInvitation(invitationId)
    const toastId = toast.loading("Canceling invitation...")
    try {
      await authClient.organization.cancelInvitation({ invitationId })
      toast.success("Invitation canceled.", { id: toastId })
      refetchInvitations()
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel invitation.", { id: toastId })
    } finally {
      setIsCancelingInvitation(null)
    }
  }

  const handleRemoveMember = async (memberId: string, memberEmail: string) => {
    if (!confirm(`Are you sure you want to remove ${memberEmail} from this organization?`)) return
    
    const toastId = toast.loading("Removing member...")
    try {
      await authClient.organization.removeMember({ memberIdOrEmail: memberId })
      toast.success("Member removed.", { id: toastId })
      refetchMembers()
    } catch (err: any) {
      toast.error(err.message || "Failed to remove member.", { id: toastId })
    }
  }

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    const toastId = toast.loading("Updating role...")
    try {
      await authClient.organization.updateMemberRole({
        memberId,
        role: newRole,
      })
      toast.success("Role updated.", { id: toastId })
      refetchMembers()
    } catch (err: any) {
      toast.error(err.message || "Failed to update role.", { id: toastId })
    }
  }

  // Check if a member can be managed (owner cannot be managed, owners/admins manage other lower members)
  const canManageMember = (targetMember: any) => {
    if (targetMember.role === "owner") return false
    if (currentUserRole === "owner") return true
    if (currentUserRole === "admin" && targetMember.role !== "admin") return true
    return false
  }

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <Layout>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
        
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            <HugeiconsIcon icon={UserGroupIcon} className="size-8 text-primary" />
            Members & Organization Access
          </h1>
          <p className="max-w-2xl text-muted-foreground text-sm">
            Manage roles, issue key access, and invite members to collaborate in {activeOrg?.name || "your organization"}.
          </p>
        </div>

        {/* Invite Member Section (Only visible to owner/admin) */}
        {canInvite && (
          <Card className="border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-base text-foreground flex items-center gap-2">
                <HugeiconsIcon icon={UserAdd01Icon} className="size-5 text-primary" />
                Invite Member
              </CardTitle>
              <CardDescription>
                Send an email invitation to invite a colleague to join your organization.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleInviteSubmit} className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 space-y-2 w-full">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="colleague@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isInviting}
                    required
                  />
                </div>
                
                <div className="space-y-2 w-full md:w-64">
                  <Label htmlFor="invite-role">Organization Role</Label>
                  <select
                    id="invite-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as "admin" | "signer" | "viewer")}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isInviting}
                  >
                    {availableRoles.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.value.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <Button type="submit" disabled={isInviting} className="w-full md:w-auto font-semibold">
                  {isInviting ? (
                    <HugeiconsIcon icon={Loading03Icon} className="size-4 animate-spin" />
                  ) : (
                    <HugeiconsIcon icon={MailSendIcon} className="size-4" />
                  )}
                  Send Invite
                </Button>
              </form>
            </CardContent>
            {/* Show descriptions of roles */}
            <CardFooter className="bg-muted/30 border-t border-border p-4 text-xxs text-muted-foreground">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                <div>
                  <span className="font-semibold text-foreground">ADMIN:</span> Edit settings, generate cryptography keys, invite/remove users, issue & revoke credentials.
                </div>
                <div>
                  <span className="font-semibold text-foreground">SIGNER:</span> Digitally sign new PDF documents and upload credentials. Cannot edit settings.
                </div>
                <div>
                  <span className="font-semibold text-foreground">VIEWER:</span> Read-only access to view issued credentials, verification stats, and logs.
                </div>
              </div>
            </CardFooter>
          </Card>
        )}

        {/* Active Members Table */}
        <Card className="border-border bg-card shadow-sm overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base text-foreground flex items-center gap-2">
              <HugeiconsIcon icon={UserCheck01Icon} className="size-5 text-emerald-500" />
              Active Members
            </CardTitle>
            <CardDescription>
              List of users who currently have access to your organization dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {membersPending ? (
              <div className="flex h-32 w-full items-center justify-center">
                <HugeiconsIcon icon={Loading03Icon} className="size-6 text-primary animate-spin" />
              </div>
            ) : members.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No active members found.
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-muted-foreground font-medium">
                      <th className="p-3">User</th>
                      <th className="p-3">Joined Date</th>
                      <th className="p-3">Role</th>
                      {canInvite && <th className="p-3 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {members.map((member: any) => (
                      <tr key={member.id} className="hover:bg-muted/10 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            {member.user.image ? (
                              <img src={member.user.image} className="size-7 rounded-full border border-border" alt="avatar" />
                            ) : (
                              <div className="size-7 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold">
                                {member.user.name?.[0] || "U"}
                              </div>
                            )}
                            <div>
                              <div className="font-semibold text-foreground">{member.user.name}</div>
                              <div className="text-[10px] text-muted-foreground">{member.user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {formatDate(member.createdAt)}
                        </td>
                        <td className="p-3">
                          {canManageMember(member) ? (
                            <select
                              value={member.role}
                              onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                              className="bg-transparent border border-border rounded px-1.5 py-0.5 text-xs focus:ring-1 focus:ring-primary"
                            >
                              <option value="admin">ADMIN</option>
                              <option value="signer">SIGNER</option>
                              <option value="viewer">VIEWER</option>
                            </select>
                          ) : (
                            <span className={`inline-flex items-center rounded-md px-2 py-0.5 font-bold text-[10px] border ${
                              member.role === "owner"
                                ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                : member.role === "admin"
                                ? "bg-primary/10 text-primary border-primary/20"
                                : "bg-slate-500/10 text-slate-500 border-slate-500/20"
                            }`}>
                              {member.role.toUpperCase()}
                            </span>
                          )}
                        </td>
                        {canInvite && (
                          <td className="p-3 text-right">
                            {canManageMember(member) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveMember(member.id, member.user.email)}
                                className="text-muted-foreground hover:text-destructive size-7"
                                title="Remove User"
                              >
                                <HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
                              </Button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Invitations Table */}
        {canInvite && (
          <Card className="border-border bg-card shadow-sm overflow-hidden">
            <CardHeader>
              <CardTitle className="text-base text-foreground flex items-center gap-2">
                <HugeiconsIcon icon={MailSendIcon} className="size-5 text-muted-foreground" />
                Pending Invitations
              </CardTitle>
              <CardDescription>
                Colleagues who have been sent invitations but have not yet registered or accepted.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {invitationsPending ? (
                <div className="flex h-24 w-full items-center justify-center">
                  <HugeiconsIcon icon={Loading03Icon} className="size-6 text-primary animate-spin" />
                </div>
              ) : invitations.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No pending invitations.
                </div>
              ) : (
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 text-muted-foreground font-medium">
                        <th className="p-3">Email</th>
                        <th className="p-3">Role</th>
                        <th className="p-3">Expires</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {invitations.map((inv: any) => (
                        <tr key={inv.id} className="hover:bg-muted/10 transition-colors">
                          <td className="p-3 text-foreground font-medium">
                            {inv.email}
                          </td>
                          <td className="p-3">
                            <span className="inline-flex items-center rounded bg-slate-800 border border-slate-700 px-1.5 py-0.5 text-[9px] font-bold text-slate-300">
                              {inv.role?.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {formatDate(inv.expiresAt)}
                          </td>
                          <td className="p-3 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={isCancelingInvitation === inv.id}
                              onClick={() => handleCancelInvitation(inv.id)}
                              className="text-muted-foreground hover:text-destructive size-7"
                              title="Cancel Invitation"
                            >
                              {isCancelingInvitation === inv.id ? (
                                <HugeiconsIcon icon={Loading03Icon} className="size-3.5 animate-spin" />
                              ) : (
                                <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" />
                              )}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

      </div>
    </Layout>
  )
}

export default Members
